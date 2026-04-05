import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTrip, type Trip } from "../../../shared/api/trips";
import { tripSchema, type TripFormData } from "../schemas/tripSchema";
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
  });

  const onSubmit = async (data: TripFormData) => {
    const newTrip = await createTrip(token, {
      title: data.title,
      destination: data.destination,
      start_date: data.start_date,
      end_date: data.end_date,
      notes: data.notes,
    });
    onSuccess(newTrip);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="create-trip-form" noValidate>
      <h2>New Trip</h2>

      <div className="ctf-field">
        <label htmlFor="ctf-title" className="ctf-label">
          Title
        </label>
        <input
          id="ctf-title"
          placeholder="e.g. Summer in Rome"
          className={errors.title ? "ctf-input ctf-input--error" : "ctf-input"}
          {...register("title")}
        />
        {errors.title && (
          <p className="ctf-error" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="ctf-field">
        <label htmlFor="ctf-destination" className="ctf-label">
          Destination
        </label>
        <input
          id="ctf-destination"
          placeholder="e.g. Rome, Italy"
          className={errors.destination ? "ctf-input ctf-input--error" : "ctf-input"}
          {...register("destination")}
        />
        {errors.destination && (
          <p className="ctf-error" role="alert">
            {errors.destination.message}
          </p>
        )}
      </div>

      <div className="ctf-row">
        <div className="ctf-field">
          <label htmlFor="ctf-start-date" className="ctf-label">
            Start date
          </label>
          <input
            id="ctf-start-date"
            type="date"
            className={errors.start_date ? "ctf-input ctf-input--error" : "ctf-input"}
            {...register("start_date")}
          />
          {errors.start_date && (
            <p className="ctf-error" role="alert">
              {errors.start_date.message}
            </p>
          )}
        </div>

        <div className="ctf-field">
          <label htmlFor="ctf-end-date" className="ctf-label">
            End date
          </label>
          <input
            id="ctf-end-date"
            type="date"
            className={errors.end_date ? "ctf-input ctf-input--error" : "ctf-input"}
            {...register("end_date")}
          />
          {errors.end_date && (
            <p className="ctf-error" role="alert">
              {errors.end_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="ctf-field">
        <label htmlFor="ctf-notes" className="ctf-label">
          Interests{" "}
          <span className="ctf-label-hint">(optional — e.g. food, history, nature)</span>
        </label>
        <input
          id="ctf-notes"
          placeholder="food, history, nature"
          className="ctf-input"
          {...register("notes")}
        />
      </div>

      {/* react-hook-form surfaces network/server errors through the root error */}
      {errors.root && (
        <p className="ctf-error ctf-error--root" role="alert">
          {errors.root.message}
        </p>
      )}

      <div className="ctf-actions">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? "Creating…" : "Create Trip"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
};
