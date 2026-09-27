import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAvailableSeats,
  getUserActiveLocks,
  lockSeat,
  unlockSeat,
  validateSeatSelection,
} from "../services/api";

const money = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

const seatOrder = (left, right) => {
  const leftNumber = Number(left.seat_number.match(/\d+/)?.[0] || 0);
  const rightNumber = Number(right.seat_number.match(/\d+/)?.[0] || 0);
  return leftNumber - rightNumber || left.seat_number.localeCompare(right.seat_number);
};

function SeatBookingPanel({ train, details, journey, token }) {
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [locks, setLocks] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState("");
  const [busySeat, setBusySeat] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [clockNow, setClockNow] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [availability, ownedLocks] = await Promise.all([
        getAvailableSeats(journey),
        getUserActiveLocks(journey, token),
      ]);
      setSeats(availability.seats || []);
      setLocks(ownedLocks.locks || []);
      setError("");
    } catch (requestError) {
      setError(requestError.status === 401
        ? "Your session has expired. Sign in again to manage your seats."
        : requestError.message || "Could not refresh seat availability.");
    } finally {
      setLoadingSeats(false);
    }
  }, [journey, token]);

  useEffect(() => {
    const initialLoad = window.setTimeout(refresh, 0);
    const poll = window.setInterval(refresh, 6000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(poll);
    };
  }, [refresh]);

  const coaches = useMemo(() => {
    const grouped = new Map();
    seats.forEach((seat) => {
      if (!grouped.has(seat.coach_name)) {
        grouped.set(seat.coach_name, { name: seat.coach_name, type: seat.seat_type, seats: [] });
      }
      grouped.get(seat.coach_name).seats.push(seat);
    });
    return [...grouped.values()].map((coach) => ({
      ...coach,
      seats: coach.seats.sort(seatOrder),
    }));
  }, [seats]);

  const locksBySeat = useMemo(
    () => new Map(locks.map((lock) => [Number(lock.seat_id), lock])),
    [locks],
  );
  const selectedSeats = useMemo(
    () => locks.map((lock) => ({ ...lock, seat_id: Number(lock.seat_id) })),
    [locks],
  );
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price || 0), 0);
  const currentCoach = coaches.find((coach) => coach.name === selectedCoach) || coaches[0];
  const soonestExpiry = locks.length
    ? Math.min(...locks.map((lock) => new Date(lock.expires_at).getTime()))
    : null;
  const secondsLeft = soonestExpiry == null || !clockNow
    ? null
    : Math.max(0, Math.ceil((soonestExpiry - clockNow) / 1000));

  useEffect(() => {
    const countdown = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(countdown);
  }, []);

  useEffect(() => {
    if (soonestExpiry == null) return undefined;
    const expiryRefresh = window.setTimeout(refresh, Math.max(0, soonestExpiry - Date.now()) + 50);
    return () => window.clearTimeout(expiryRefresh);
  }, [soonestExpiry, refresh]);

  const handleSeatClick = async (seat) => {
    const existingLock = locksBySeat.get(Number(seat.seat_id));
    setError("");
    setNotice("");
    setBusySeat(seat.seat_id);

    try {
      if (existingLock) {
        await unlockSeat(existingLock.lock_id, token);
        setNotice(`${seat.seat_number} released.`);
      } else if (seat.status === "available") {
        const result = await lockSeat(journey, seat.seat_id, token);
        if (result.unlocked) {
          setNotice(`${seat.seat_number} released.`);
        } else {
          setNotice(`${seat.seat_number} is locked for five minutes.`);
        }
      } else {
        return;
      }
      await refresh();
    } catch (requestError) {
      await refresh();
      setError(requestError.status === 401
        ? "Your session has expired. Sign in again to continue."
        : requestError.message || "That seat could not be selected.");
    } finally {
      setBusySeat(null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSeats.length || confirming) return;
    setConfirming(true);
    setError("");
    try {
      const validation = await validateSeatSelection(
        journey,
        selectedSeats.map((seat) => seat.seat_id),
        token,
      );
      navigate("/booking/confirm", {
        state: {
          booking: {
            journey,
            train,
            route: details.route,
            seats: validation.seats,
            total: validation.total,
            passengerCount: validation.passenger_count,
            departure: train.departure_from_source,
            arrival: train.arrival_at_destination,
          },
        },
      });
    } catch (requestError) {
      setError(requestError.message || "Some locks are no longer valid. Refresh the seats and try again.");
      await refresh();
    } finally {
      setConfirming(false);
    }
  };

  const seatRows = currentCoach
    ? Array.from({ length: Math.ceil(currentCoach.seats.length / 4) }, (_, rowIndex) =>
      currentCoach.seats.slice(rowIndex * 4, rowIndex * 4 + 4))
    : [];

  return (
    <section className="seat-booking">
      <div className="coach-picker-header">
        <div>
          <h3>Select a coach</h3>
          <p>Coach availability and fares are refreshed from the railway server.</p>
        </div>
        {secondsLeft !== null && (
          <span className="lock-countdown" aria-live="polite">
            Locks expire in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      <div className="coach-picker" role="tablist" aria-label="Train coaches">
        {coaches.map((coach) => (
          <button
            type="button"
            role="tab"
            aria-selected={currentCoach?.name === coach.name}
            className={`coach-option ${currentCoach?.name === coach.name ? "is-active" : ""}`}
            key={coach.name}
            onClick={() => setSelectedCoach(coach.name)}
          >
            <strong>{coach.name}</strong>
            <span>{coach.type} · {coach.seats.length} seats</span>
          </button>
        ))}
      </div>

      {error && <div className="booking-error" role="alert">{error}</div>}
      {notice && <div className="booking-notice" role="status">{notice}</div>}

      {loadingSeats ? (
        <div className="booking-loading">Loading seat availability…</div>
      ) : !coaches.length ? (
        <div className="booking-empty">No coaches or seats were returned for this train.</div>
      ) : (
        <div className="seat-layout-and-summary">
          <div className="seat-map-column">
            <div className="seat-legend" aria-label="Seat status legend">
              <span><i className="legend-dot available" /> Available</span>
              <span><i className="legend-dot pending" /> Temporarily locked</span>
              <span><i className="legend-dot booked" /> Booked</span>
              <span><i className="legend-dot selected" /> Yours</span>
            </div>

            <div className="coach-seat-shell">
              <div className="coach-direction front-direction">
                <span>↑</span>
                <strong>Front / Forward</strong>
              </div>
              <div className="coach-seat-interior">
                <div className="seat-grid" role="group" aria-label={`${selectedCoach} seat layout`}>
                  {seatRows.map((row, rowIndex) => (
                    <div className="seat-row" key={`${selectedCoach}-${rowIndex}`}>
                      {row.slice(0, 2).map((seat) => renderSeat(seat, locksBySeat, busySeat, handleSeatClick))}
                      <span className="seat-aisle" aria-hidden="true" />
                      {row.slice(2, 4).map((seat) => renderSeat(seat, locksBySeat, busySeat, handleSeatClick))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="coach-direction back-direction">
                <span>↓</span>
                <strong>Back / Backward</strong>
              </div>
            </div>
            {currentCoach && (
              <p className="coach-layout-caption">
                {currentCoach.name} · {currentCoach.type} · seat facing direction is shown on each seat.
              </p>
            )}
          </div>

          <aside className="booking-summary">
            <div className="booking-summary-title">
              <div>
                <p className="booking-eyebrow">YOUR JOURNEY</p>
                <h3>Selected seats</h3>
              </div>
              <span className="selected-count">{selectedSeats.length} / 4</span>
            </div>
            {selectedSeats.length ? (
              <ul className="selected-seat-list">
                {selectedSeats.map((seat) => (
                  <li key={seat.seat_id}>
                    <div>
                      <strong>{seat.seat_number}</strong>
                      <span>{seat.coach_name} · {seat.seat_type}</span>
                      <small>Temporarily locked by you</small>
                      <small>Locked until {new Date(seat.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                    </div>
                    <strong>{money(seat.price)}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="summary-empty">Choose an available seat to add it here.</p>
            )}
            <div className="booking-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <button
              type="button"
              className="booking-confirm-button"
              disabled={!selectedSeats.length || confirming}
              onClick={handleConfirm}
            >
              {confirming ? "Checking locks…" : "Confirm seats"}
            </button>
            <p className="summary-footnote">The server verifies your active locks and fare before continuing.</p>
          </aside>
        </div>
      )}
    </section>
  );
}

function renderSeat(seat, locksBySeat, busySeat, handleSeatClick) {
  const ownLock = locksBySeat.get(Number(seat.seat_id));
  const status = ownLock ? "selected" : seat.status;
  const disabled = (!ownLock && seat.status !== "available") || busySeat === seat.seat_id;
  const label = ownLock
    ? `${seat.seat_number}, selected and temporarily locked by you`
    : `${seat.seat_number}, ${seat.status}`;

  return (
    <button
      type="button"
      className={`seat-tile seat-${status}`}
      key={seat.seat_id}
      disabled={disabled}
      aria-label={label}
      title={`${seat.seat_number} · ${seat.direction || "Direction unavailable"} · ${money(seat.price)}`}
      onClick={() => handleSeatClick(seat)}
    >
      {busySeat === seat.seat_id ? "…" : seat.seat_number}
      <small>{seat.direction === "Forward" ? "↑" : seat.direction === "Backward" ? "↓" : ""}</small>
    </button>
  );
}

export default SeatBookingPanel;
