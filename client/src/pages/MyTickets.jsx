import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelMyTicket, getMyTickets } from "../services/api";

const money = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;
const dateLabel = (value) => String(value).slice(0, 10);

function TicketGroup({ title, tickets, onCancel, cancellingId }) {
  return (
    <section className="my-ticket-group">
      <h2>{title}</h2>
      {tickets.length === 0 ? (
        <p className="my-tickets-empty">No {title.toLowerCase()} tickets.</p>
      ) : (
        <div className="my-ticket-list">
          {tickets.map((ticket) => (
            <article className="my-ticket-card" key={ticket.ticket_id}>
              <div className="my-ticket-topline">
                <div>
                  <p className="booking-eyebrow">TICKET #{ticket.ticket_id}</p>
                  <h3>{ticket.train_name}</h3>
                </div>
                <span className={`my-ticket-status status-${ticket.status}`}>{ticket.status}</span>
              </div>
              <p className="my-ticket-route">{ticket.from_station} <span>→</span> {ticket.to_station}</p>
              <div className="my-ticket-facts">
                <span><strong>Date</strong>{dateLabel(ticket.date)}</span>
                <span><strong>Departure</strong>{ticket.origin_departure_time || ticket.starting_time || "Not provided"}</span>
                <span><strong>Seats</strong>{ticket.no_of_seats}</span>
                <span><strong>Payment</strong>{ticket.payment_status || "—"}</span>
                <span><strong>Amount</strong>{money(ticket.amount)}</span>
              </div>
              <div className="my-ticket-actions">
                {ticket.status === "booked" && ticket.payment_status === "paid" && (
                  <Link className="button-link secondary-link" to={`/booking/ticket/${ticket.ticket_id}`}>View ticket</Link>
                )}
                {title === "Upcoming" && ticket.status === "booked" && ticket.payment_status === "paid" && (
                  <button
                    type="button"
                    className="button-link secondary-link"
                    disabled={cancellingId === ticket.ticket_id}
                    onClick={() => onCancel(ticket)}
                  >
                    {cancellingId === ticket.ticket_id ? "Cancelling…" : "Cancel ticket"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MyTickets() {
  const token = localStorage.getItem("token");
  const [tickets, setTickets] = useState({ upcoming: [], travelled: [] });
  const [loading, setLoading] = useState(Boolean(token));
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");

  const loadTickets = useCallback(async () => {
    if (!token) return;
    try {
      const result = await getMyTickets(token);
      setTickets({ upcoming: result.upcoming || [], travelled: result.travelled || [] });
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load your tickets.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const cancelTicket = async (ticket) => {
    if (!window.confirm(`Cancel ticket #${ticket.ticket_id}? The paid amount will be marked as refunded.`)) return;
    setCancellingId(ticket.ticket_id);
    setError("");
    try {
      await cancelMyTicket(ticket.ticket_id, token);
      await loadTickets();
    } catch (requestError) {
      setError(requestError.message || "Could not cancel this ticket.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="booking-page my-tickets-page">
      <header className="booking-page-header">
        <Link className="booking-brand" to="/dashboard">🚆 Railway<span>Booking</span></Link>
        <Link className="quiet-link" to="/dashboard">Train search</Link>
      </header>
      <div className="booking-page-content">
        <div className="success-heading">
          <div><p className="booking-eyebrow">YOUR BOOKINGS</p><h1>My Tickets</h1></div>
        </div>
        {!token && <div className="booking-error" role="alert">Sign in to view your tickets.</div>}
        {error && <div className="booking-error" role="alert">{error}</div>}
        {loading ? <div className="booking-loading">Loading your tickets…</div> : (
          <>
            <TicketGroup title="Upcoming" tickets={tickets.upcoming} onCancel={cancelTicket} cancellingId={cancellingId} />
            <TicketGroup title="Travelled" tickets={tickets.travelled} onCancel={cancelTicket} cancellingId={cancellingId} />
          </>
        )}
      </div>
    </main>
  );
}

export default MyTickets;
