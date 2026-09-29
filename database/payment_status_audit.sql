-- Run this migration against the PostgreSQL database after creating the
-- payment table. It records each actual payment status change.

CREATE TABLE IF NOT EXISTS payment_status_audit (
    audit_id BIGSERIAL PRIMARY KEY,
    payment_id INT NOT NULL,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payment_status_audit (payment_id, old_status, new_status)
        VALUES (NEW.payment_id, OLD.status, NEW.status);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payment_status_audit_trigger ON payment;

CREATE TRIGGER payment_status_audit_trigger
AFTER UPDATE OF status ON payment
FOR EACH ROW
EXECUTE FUNCTION log_payment_status_change();
