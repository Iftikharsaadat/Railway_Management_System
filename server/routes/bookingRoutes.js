const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/authMiddleware');
const booking = require('../controllers/bookingController');

router.get('/seats', booking.availableSeats);
router.post('/locks', verifyToken, booking.lockSeat);
router.get('/locks', verifyToken, booking.myLocks);
router.delete('/locks/:lock_id', verifyToken, booking.unlockSeat);
router.post('/selection/validate', verifyToken, booking.validateSelection);
router.post('/bookings', verifyToken, booking.createBooking);
router.post('/bookings/:ticket_id/payment', verifyToken, booking.confirmPayment);
router.get('/my-tickets', verifyToken, booking.myTickets);
router.post('/tickets/:ticket_id/cancel', verifyToken, booking.cancelTicket);
router.get('/tickets/:ticket_id', verifyToken, booking.ticket);
router.get('/tickets/:ticket_id/pdf', verifyToken, booking.ticketPdf);

module.exports = router;
