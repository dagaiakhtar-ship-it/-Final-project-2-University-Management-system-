import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, Users, Plus, 
  Tag, ShieldAlert, CheckCircle, AlertTriangle 
} from 'lucide-react';

interface EventParticipant {
  id: number;
  eventId: number;
  studentId?: number;
  alumniId?: number;
}

interface AlumniEvent {
  id: number;
  title: string;
  description: string;
  eventType: string;
  venue: string;
  startDate: string;
  endDate: string;
  organizer: string;
  registrationDeadline: string;
  maximumParticipants?: number;
  createdAt: string;
  participants: EventParticipant[];
}

interface AlumniEventsProps {
  events: AlumniEvent[];
  currentUserRole?: string;
  currentStudentId?: number;
  myProfileId?: number;
  onCreateEvent: (eventData: any) => Promise<void>;
  onRegisterEvent: (eventId: number) => Promise<void>;
}

export const AlumniEvents: React.FC<AlumniEventsProps> = ({
  events,
  currentUserRole,
  currentStudentId,
  myProfileId,
  onCreateEvent,
  onRegisterEvent,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Networking Dinner');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [organizer, setOrganizer] = useState('Alumni & Career Office');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [maximumParticipants, setMaximumParticipants] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onCreateEvent({
        title,
        description,
        eventType,
        venue,
        startDate,
        endDate,
        organizer,
        registrationDeadline,
        maximumParticipants: Number(maximumParticipants),
      });
      // reset form
      setTitle('');
      setDescription('');
      setVenue('');
      setStartDate('');
      setEndDate('');
      setRegistrationDeadline('');
      setMaximumParticipants('100');
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" id="alumni-events-container">
      {/* Top Banner with Event Addition for Admins */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">Alumni Events Calendar</h4>
          <p className="text-xs text-slate-500">Participate in professional networking events, mentorship classes, and panels.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Plus className="h-4 w-4" /> Create New Event
          </button>
        )}
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500">
          No alumni events are currently scheduled.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const hasRegistered = event.participants.some(
              p => (currentStudentId && p.studentId === currentStudentId) || (myProfileId && p.alumniId === myProfileId)
            );

            const isFull = event.maximumParticipants ? event.participants.length >= event.maximumParticipants : false;
            const isDeadlinePassed = new Date(event.registrationDeadline) < new Date();
            const isClosed = isFull || isDeadlinePassed;

            return (
              <div 
                key={event.id} 
                className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                id={`event-card-${event.id}`}
              >
                <div>
                  {/* Event Type & Header */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {event.eventType}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Org: {event.organizer}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-2">{event.title}</h4>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-3">{event.description}</p>

                  {/* Details block */}
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-100 mb-4 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{new Date(event.startDate).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>
                        Capacity: {event.participants.length} / {event.maximumParticipants || 'Unlimited'} registered
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
                  {hasRegistered ? (
                    <span className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100 flex items-center gap-1.5 w-full justify-center">
                      <CheckCircle className="h-4 w-4" /> Successfully Registered
                    </span>
                  ) : isClosed ? (
                    <span className="bg-red-50 text-red-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1.5 w-full justify-center">
                      <AlertTriangle className="h-4 w-4" /> 
                      {isFull ? 'Registration Full' : 'Registration Closed'}
                    </span>
                  ) : (
                    <button
                      onClick={() => onRegisterEvent(event.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold w-full text-center transition-colors shadow-sm"
                    >
                      Register for Event
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Create Alumni Event</h3>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Event Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. Annual Alumni Meetup 2026"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      rows={3}
                      placeholder="Provide event overview..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="Networking Dinner">Networking Dinner</option>
                      <option value="Career Seminar">Career Seminar</option>
                      <option value="Guest Lecture">Guest Lecture</option>
                      <option value="Homecoming Reunion">Homecoming Reunion</option>
                      <option value="Fundraising Gala">Fundraising Gala</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Venue</label>
                    <input
                      type="text"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. Main Auditorium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Organizer</label>
                    <input
                      type="text"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      placeholder="e.g. CS Department"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Registration Deadline</label>
                    <input
                      type="datetime-local"
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Maximum Seats</label>
                    <input
                      type="number"
                      value={maximumParticipants}
                      onChange={(e) => setMaximumParticipants(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
