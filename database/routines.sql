-- Apply after database/schema2.sql (or the equivalent schema) has been run.

CREATE OR REPLACE FUNCTION calculate_fare(
    p_seat_type VARCHAR,
    p_distance_km NUMERIC
)
RETURNS NUMERIC(10, 2)
LANGUAGE SQL
STABLE
AS $$
    SELECT ROUND((fr.base_fare + fr.rate_per_km * p_distance_km)::NUMERIC, 2)
    FROM fare_rate AS fr
    WHERE fr.seat_type = p_seat_type;
$$;

CREATE OR REPLACE PROCEDURE create_route_with_stations(
    p_start_station_id INT,
    p_end_station_id INT,
    p_stations JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_route_id INT;
    v_station JSONB;
BEGIN
    INSERT INTO route (start_station_id, end_station_id)
    VALUES (p_start_station_id, p_end_station_id)
    RETURNING route_id INTO v_route_id;

    FOR v_station IN
        SELECT value FROM jsonb_array_elements(COALESCE(p_stations, '[]'::JSONB))
    LOOP
        INSERT INTO route_station (
            route_id,
            station_id,
            sequence_no,
            arrival_time,
            departure_time,
            distance_km
        )
        VALUES (
            v_route_id,
            (v_station->>'station_id')::INT,
            (v_station->>'sequence_no')::INT,
            NULLIF(v_station->>'arrival_time', '')::TIME,
            NULLIF(v_station->>'departure_time', '')::TIME,
            (v_station->>'distance_km')::NUMERIC
        );
    END LOOP;
END;
$$;
