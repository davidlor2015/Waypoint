import type { Itinerary } from "../../../shared/api/ai";
import "./ItineraryPanel.css";

interface ItineraryPanelProps {
  itinerary: Itinerary;
  onApply?: () => void;
  applying?: boolean;
}

export const ItineraryPanel = ({
  itinerary,
  onApply,
  applying,
}: ItineraryPanelProps) => {
  return (
    <div className="itinerary-panel">
      <h4 className="itinerary-title">{itinerary.title}</h4>
      <p className="itinerary-summary">{itinerary.summary}</p>

      {itinerary.days.map((day) => (
        <div key={day.day_number} className="itinerary-day">
          <h5>Day {day.day_number}</h5>
          {day.items.map((item, i) => (
            <div key={i} className="itinerary-item">
              {/* Left Side: Time, Title, and Location */}
              <div className="itinerary-item-left">
                <div className="itinerary-item-header">
                  {item.time && (
                    <span className="itinerary-item-time">{item.time}</span>
                  )}
                  <strong>{item.title}</strong>
                </div>
                {item.location && (
                  <div className="itinerary-item-location">{item.location}</div>
                )}
                {item.notes && (
                  <div className="itinerary-item-notes">{item.notes}</div>
                )}
              </div>

              {/* Right Side: Cost */}
              {item.cost_estimate && (
                <div className="itinerary-item-cost">{item.cost_estimate}</div>
              )}
            </div>
          ))}
        </div>
      ))}

      {onApply && (
        <button
          onClick={onApply}
          disabled={applying}
          className="itinerary-apply-btn"
        >
          {applying ? "Saving..." : "Apply Itinerary to Trip"}
        </button>
      )}
    </div>
  );
};
