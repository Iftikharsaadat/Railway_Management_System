import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTicket } from "../services/api";

const money = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

function TicketPage() {
  const { ticketId } = useParams();
  const token = localStorage.getItem("token");
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    getTicket(ticketId, token)
      .then((data) => { if (active) setTicket(data); })
      .catch((requestError) => { if (active) setError(requestError.message || "Could not load this ticket."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [ticketId, token]);

  const paid = ticket?.status === "booked" && ticket?.payment_status === "paid";

  return (
    <main className="booking-page ticket-page">
      <header className="booking-page-header no-print">
        <Link className="booking-brand" to="/">🚆 AmarRail</Link>
        <Link className="quiet-link" to="/">Home</Link>
      </header>
      <div className="booking-page-content">
        {loading && <div className="booking-loading">Loading ticket…</div>}
        {(error || (!token && "Sign in to view this ticket.")) && <div className="booking-error" role="alert">{error || "Sign in to view this ticket."}</div>}
        {ticket && !paid && (
          <div className="booking-error" role="status">
            This ticket is not paid and confirmed. No booking success is shown.
          </div>
        )}
        {paid && (
          <>
            <div className="success-heading no-print">
              <span className="success-mark">✓</span>
              <div><p className="booking-eyebrow">BOOKING SUCCESSFUL</p><h1>Your ticket is confirmed</h1></div>
            </div>
            <article className="print-ticket">
              <div className="ticket-topline">
                <div><p className="booking-eyebrow">RAILWAY PASS</p><h2>{ticket.train_name}</h2></div>
                <span className="ticket-status">{ticket.status}</span>
              </div>
              <div className="ticket-id-row"><span>Ticket ID</span><strong>#{ticket.ticket_id}</strong></div>
              <div className="ticket-route-row">
                <div><span>From</span><strong>{ticket.from_station}</strong></div>
                <span className="route-arrow">→</span>
                <div><span>To</span><strong>{ticket.to_station}</strong></div>
              </div>
              <div className="ticket-facts">
                <div><span>Journey date</span><strong>{String(ticket.date).slice(0, 10)}</strong></div>
                <div><span>Departure</span><strong>{ticket.origin_departure_time || ticket.starting_time || "Not provided"}</strong></div>
                <div><span>Arrival</span><strong>{ticket.destination_arrival_time || "Not provided"}</strong></div>
                <div><span>Passenger</span><strong>{ticket.purchaser_name}</strong></div>
                <div><span>Passengers</span><strong>{ticket.no_of_seats}</strong></div>
              </div>
              <h3>Seats</h3>
              <div className="ticket-seat-list">
                {(ticket.seats || []).map((seat) => (
                  <div className="ticket-seat-row" key={seat.seat_id}>
                    <strong>{seat.coach} · {seat.seat_number}</strong>
                    <span>{seat.seat_type}</span>
                    <span>{money(seat.price)}</span>
                  </div>
                ))}
              </div>
              <div className="ticket-payment-row">
                <div><span>Payment</span><strong>{ticket.method || "—"} · {ticket.payment_status}</strong></div>
                <div><span>Total paid</span><strong>{money(ticket.amount)}</strong></div>
              </div>
              <p className="ticket-footer">Please keep this ticket available for your journey.</p>
            </article>
            <div className="ticket-actions no-print">
              <button type="button" className="booking-confirm-button" onClick={() => window.print()}>Print ticket</button>
              <Link className="button-link secondary-link" to="/dashboard">Return home</Link>
            </div>
          </>
        )}
        {!loading && !ticket && !error && <Link to="/dashboard">Return home</Link>}
      </div>
    </main>
  );
}

export default TicketPage;
