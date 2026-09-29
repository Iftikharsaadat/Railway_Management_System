import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  confirmBookingPayment,
  createBooking,
  getTicket,
  validateSeatSelection,
} from "../services/api";

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Card"];
const money = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

function ConfirmationPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const booking = state?.booking;
  const [validatedBooking, setValidatedBooking] = useState(booking);
  const [method, setMethod] = useState("");
  const [loading, setLoading] = useState(Boolean(booking));
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paying, setPaying] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);

  useEffect(() => {
    if (!booking || !token) {
      return;
    }

    let active = true;
    validateSeatSelection(
      booking.journey,
      booking.seats.map((seat) => seat.seat_id),
      token,
    ).then((result) => {
      if (!active) return;
      setValidatedBooking({
        ...booking,
        seats: result.seats,
        total: result.total,
        passengerCount: result.passenger_count,
      });
      setError("");
    }).catch((requestError) => {
      if (active) setError(requestError.message || "Your seat locks are no longer valid.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [booking, token]);

  useEffect(() => {
    if (!validatedBooking?.seats?.length) return undefined;
    const updateCountdown = () => {
      const times = validatedBooking.seats
        .map((seat) => new Date(seat.expires_at || seat.lock_expires_at).getTime())
        .filter(Number.isFinite);
      if (times.length) setSecondsLeft(Math.max(0, Math.ceil((Math.min(...times) - Date.now()) / 1000)));
    };
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [validatedBooking]);

  const handlePay = async () => {
    if (!method) {
      setPaymentMessage("Choose a payment method first.");
      return;
    }
    if (!validatedBooking || paying) return;

    setPaying(true);
    setPaymentMessage("");
    setError("");

    try {
      const seatIds = validatedBooking.seats.map((seat) => seat.seat_id);

      // Recheck locks, then use the backend's current simulated-payment flow.
      await validateSeatSelection(validatedBooking.journey, seatIds, token);
      const bookingResult = pendingTicketId
        ? { ticket: { ticket_id: pendingTicketId } }
        : await createBooking(validatedBooking.journey, seatIds, token);
      setPendingTicketId(bookingResult.ticket.ticket_id);
      const paymentResult = await confirmBookingPayment(
        bookingResult.ticket.ticket_id,
        method,
        token,
      );

      if (paymentResult.ticket?.status !== "booked" || paymentResult.payment?.status !== "paid") {
        throw new Error("The backend did not confirm payment. Your ticket has not been booked.");
      }

      const ticket = await getTicket(bookingResult.ticket.ticket_id, token);
      if (ticket.status !== "booked" || ticket.payment_status !== "paid") {
        throw new Error("Payment was processed, but the confirmed ticket could not be retrieved.");
      }

      navigate(`/booking/ticket/${ticket.ticket_id}`, { replace: true });
    } catch (requestError) {
      setPaymentMessage(requestError.message || "Payment could not be confirmed. Your seat locks may have expired.");
    } finally {
      setPaying(false);
    }
  };

  if (!token) {
    return <BookingMessage title="Sign in required" message="Sign in to confirm your seat selection." action={<Link className="button-link" to="/login">Go to sign in</Link>} />;
  }

  if (!booking) {
    return <BookingMessage title="Booking details unavailable" message="Return to your train search and select seats again." action={<Link className="button-link" to="/dashboard">Back to trains</Link>} />;
  }

  return (
    <main className="booking-page">
      <header className="booking-page-header">
        <Link className="booking-brand" to="/">🚆 AmarRail</Link>
        <Link className="quiet-link" to="/">Home</Link>
      </header>
      <div className="booking-page-content">
        <p className="booking-eyebrow">FINAL STEP</p>
        <h1>Confirm your journey</h1>
        <p className="booking-page-subtitle">Review your seats and choose a payment method.</p>

        {loading && <div className="booking-loading">Verifying active seat locks…</div>}
        {error && (
          <div className="booking-error" role="alert">
            {error}
            <div><Link to="/dashboard" state={{ restoreBooking: booking }}>Return to seat selection</Link></div>
          </div>
        )}

        {!loading && validatedBooking && !error && (
          <div className="confirmation-layout">
            <section className="confirmation-card">
              <div className="confirmation-train-heading">
                <div>
                  <span className="booking-eyebrow">TRAIN</span>
                  <h2>{validatedBooking.train.train_name}</h2>
                </div>
                <span className="booking-date">{validatedBooking.journey.date}</span>
              </div>
              <div className="confirmation-route">
                <div><span>From</span><strong>{validatedBooking.journey.from_name}</strong><small>{validatedBooking.departure || "Time unavailable"}</small></div>
                <span className="route-arrow">→</span>
                <div><span>To</span><strong>{validatedBooking.journey.to_name}</strong><small>{validatedBooking.arrival || "Time unavailable"}</small></div>
              </div>
              <h3>Seats and passengers</h3>
              <p className="passenger-count">Passenger count: <strong>{validatedBooking.passengerCount}</strong></p>
              <ul className="confirmation-seat-list">
                {validatedBooking.seats.map((seat) => (
                  <li key={seat.seat_id}>
                    <div>
                      <strong>{seat.seat_number}</strong>
                      <span>{seat.coach_name} · {seat.seat_type}</span>
                      <small>Lock active until {new Date(seat.expires_at || seat.lock_expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                    </div>
                    <strong>{money(seat.price)}</strong>
                  </li>
                ))}
              </ul>
              <div className="booking-total confirmation-total"><span>Total price</span><strong>{money(validatedBooking.total)}</strong></div>
              {secondsLeft !== null && <p className="confirmation-lock-time">Temporary locks expire in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}</p>}
            </section>

            <section className="confirmation-card payment-card">
              <h2>Payment method</h2>
              <p>Select one method. This project currently confirms payments through its demo backend flow.</p>
              <div className="payment-methods" role="radiogroup" aria-label="Payment method">
                {PAYMENT_METHODS.map((paymentMethod) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === paymentMethod}
                    className={`payment-method ${method === paymentMethod ? "is-selected" : ""}`}
                    key={paymentMethod}
                    onClick={() => { setMethod(paymentMethod); setPaymentMessage(""); }}
                  >
                    <span className="payment-radio" />
                    <strong>{paymentMethod}</strong>
                  </button>
                ))}
              </div>
              <div className="payment-unavailable">
                <strong>Demo payment</strong>
                <p>Pay will ask the backend to confirm this demo payment while your seat locks are active. No external payment provider or real charge is involved.</p>
              </div>
              {paymentMessage && <div className="booking-error" role="alert">{paymentMessage}</div>}
              <button type="button" className="booking-confirm-button" onClick={handlePay} disabled={!method || !validatedBooking || paying}>
                {paying ? "Confirming payment…" : "Pay"}
              </button>
              <Link className="return-seats-link" to="/dashboard" state={{ restoreBooking: validatedBooking }}>Back to seat selection</Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function BookingMessage({ title, message, action }) {
  return (
    <main className="booking-page booking-message-page">
      <section className="booking-message-card">
        <h1>{title}</h1>
        <p>{message}</p>
        {action}
        <Link className="quiet-link" to="/dashboard">Return home</Link>
      </section>
    </main>
  );
}

export default ConfirmationPage;
