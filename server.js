require('dotenv').config()

const express = require('express');
const app = express();

const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:true }))

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/create-payment-intent', async (req, res) => {
    const { amount } = req.body

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Amount in cents
        currency: 'usd',
        payment_method_types: ['card'],
      });
      res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while creating a payment intent.' });
    }
});

app.post('/create-customer-and-charge', async (req, res) => {
  try {
    const customer = await stripe.customers.create({
      email: req.body.email,
      name:'test name',
      source: req.body.token,
    });

    console.log(customer);

    const charge = await stripe.charges.create({
      amount: 1000, // Amount in cents
      currency: 'usd',
      customer: customer.id,
    });

    console.log(charge);

    res.status(200).json({ message: 'Payment successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the payment.' });
  }
});

app.post('/charge-customer', async (req, res) => {
  try {
    const {customerId} = req.body

    console.log(customerId);

    const charge = await stripe.charges.create({
      amount: 1000, // Amount in cents
      currency: 'usd',
      customer: customerId,
    });

    console.log(charge);

    res.status(200).json({ message: 'Payment successful!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the payment.' });
  }
});

app.get('/customer-balance/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    // Retrieve customer balance
    const balance = await stripe.customers.retrieve(customerId);
    
    res.status(200).json({ balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while retrieving the customer balance.' });
  }
});

app.post('/create-subscription', async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: req.body.customerId,
      items: [{ price: 'price_12345' }], // Replace with your own product price ID
    });

    res.status(200).json({ message: 'Subscription created successfully!', subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the subscription.' });
  }
});

// app.post('/payout', async (req, res) => {
//   try {
//     const { amount, destinationAccountId, customerId } = req.body;

//     // Create a PaymentIntent for the payout
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount,
//       currency: 'usd',
//       customer: customerId,
//       transfer_data: {
//         destination: destinationAccountId,
//       },
//     });

//     res.status(200).json({ message: 'Payout successful!', clientSecret: paymentIntent.client_secret });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while processing the payout.' });
//   }
// });


app.post('/payout', async (req, res) => {
  try {
    const { recipientCard } = req.body;

    // Create a payout
    const payout = await stripe.payouts.create({
      amount:500,
      currency: 'usd',
      destination: recipientCard,
    });

    res.status(200).json({ message: 'Payout successful!', payout });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the payout.' });
  }
});

app.post('/make-payout', async (req, res) => {
  const { accountId } = req.body;

  try {
    const transfer = await stripe.transfers.create({
      amount: 10 * 100, // Amount in cents
      currency: 'usd',
      source_transaction:'ch_3NONz8HHXVdH5ff20jmcUbdo',
      destination: accountId,
    });

    res.status(200).json({ message: 'Payout successful!', transfer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the payout.' });
  }
});

// app.post('/create-connect-account', async (req, res) => {
//   try {
//     // Step 1: Create a Connect Account
//     const account = await stripe.accounts.create({
//       type: 'standard', // Replace with the desired account type (standard, express, or custom)
//       business_type: 'individual', // Replace with the business type (individual or company)
//       // Add other required fields as per your application's needs
//     });

//     res.status(200).json({ accountId: account.id });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'An error occurred while creating the Connect account.' });
//   }
// });

app.post('/create-connect-account', async (req, res) => {
  try {
    const { email, country, type, bankAccountToken, cardToken } = req.body;

    // Create a Connect account with additional data
    const account = await stripe.accounts.create({
      type: 'custom',
      country: country,
      email: email,
      capabilities: {
        transfers: { requested: true }
      },
      tos_acceptance: {
        service_agreement: 'full',
      },
      // Include any additional required or optional data here
      business_type: 'individual',
      individual: {
        first_name: 'John-x222',
        last_name: 'Doe-x',
        dob: {
          day: 1,
          month: 1,
          year: 1990,
        },
        address: {
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
        },
      },
      // Provide bank account or debit card details
      external_account: bankAccountToken || cardToken,
    });

    res.status(200).json({ accountId: account.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating the Connect account.' });
  }
});


  
const port = 3000; // Choose a port number

app.listen(port, () => {
console.log(`Server running on port ${port}`);
});