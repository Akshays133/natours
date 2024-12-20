/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51KgWlxSCZK6gauplEhOn8qpo9RKvsZCxdxyRerSJ7V5W9kUCclNN1DEBW5bgt2M7USeWNRNyHgdIEeaevBVCsjHn00Q6rGaj9H');

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    console.log(tourId)
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
