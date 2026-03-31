import { useState } from "react";
import { createTrip, type Trip } from "../../../shared/api/trips";
import "./CreateTripForm.css";

interface CreateTripFormProps {
  token: string;
  onSuccess: (newTrip: Trip) => void;
  onCancel: () => void;
}

export const CreateTripForm = ({
  token,
  onSuccess,
  onCancel,
}: CreateTripFormProps) => {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [interests, setInterests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    // 1. Prevent default form submission (stops page reload)
    e.preventDefault();

    // Start loading and clear any previous errors
    setIsLoading(true);
    setError(null);

    try {
      // 2. Call createTrip with the form fields
      // Mapping camelCase state to the snake_case keys the API expects
      const newTrip = await createTrip(token, {
        title,
        destination,
        start_date: startDate,
        end_date: endDate,
        notes: interests,
      });

      // 3. Call onSuccess with the returned trip
      onSuccess(newTrip);
    } catch (err) {
      // 4. Handle errors gracefully
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create trip. Please try again.",
      );
    } finally {
      // Ensure loading state is reset whether it succeeds or fails
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-trip-form">
      <h2>New Trip</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        required
      />
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        required
      />
      <input
        placeholder="Interests (e.g. food, history, nature)"
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
        required
      />

      {error && <div className="create-trip-error">{error}</div>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create Trip"}
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};
