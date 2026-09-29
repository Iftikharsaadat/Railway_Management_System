const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const booking = require('../controllers/bookingController');

router.use(verifyToken);

router.get('/seats', booking.availableSeats);
router.post('/locks', booking.lockSeat);
router.get('/locks', booking.myLocks);
router.delete('/locks/:lock_id', booking.unlockSeat);
router.post('/selection/validate', booking.validateSelection);
router.post('/bookings', booking.createBooking);
router.post('/bookings/:ticket_id/payment', booking.confirmPayment);
router.get('/my-tickets', booking.myTickets);
router.post('/tickets/:ticket_id/cancel', booking.cancelTicket);
router.get('/tickets/:ticket_id', booking.ticket);
router.get('/tickets/:ticket_id/pdf', booking.ticketPdf);

module.exports = router;
