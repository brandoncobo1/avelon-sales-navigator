import { Globe, Phone as PhoneIcon, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { listClinics } from "@/lib/clinics";
import { startCallAction, createClinicAndStartCallAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function PreCallPage() {
  const clinics = await listClinics();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
      <h1 className="text-2xl font-semibold text-white">Start a call</h1>
      <p className="mt-1 text-sm text-white/50">
        Pick a clinic to call, or add a new one below.
      </p>

      {clinics.length > 0 && (
        <div className="mt-6 space-y-3">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-white">{clinic.name}</p>
                  {clinic.isDemo && (
                    <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-300">
                      Demo
                    </span>
                  )}
                  {clinic.hasCustomAsset && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      <Sparkles className="h-2.5 w-2.5" />
                      Asset ready
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
                  {clinic.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {clinic.website}
                    </span>
                  )}
                  {clinic.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="h-3 w-3" />
                      {clinic.phone}
                    </span>
                  )}
                  {clinic.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {clinic.location}
                    </span>
                  )}
                </div>
                {clinic.practiceNotes && (
                  <p className="mt-2 text-xs text-white/40">{clinic.practiceNotes}</p>
                )}
              </div>
              <form action={startCallAction.bind(null, clinic.id)}>
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-400 sm:w-auto"
                >
                  Start Call
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-semibold text-white">Add a new clinic</p>
        <form action={createClinicAndStartCallAction} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/50" htmlFor="name">
              Clinic name *
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="XYZ Dental Clinic"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-white/50" htmlFor="website">
                Website
              </label>
              <input
                id="website"
                name="website"
                placeholder="xyzclinic.co.uk"
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50" htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                placeholder="+44..."
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-white/50" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              placeholder="Manchester, UK"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50" htmlFor="practiceNotes">
              Practice notes
            </label>
            <textarea
              id="practiceNotes"
              name="practiceNotes"
              rows={2}
              placeholder="Anything worth knowing before the call"
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              name="hasCustomAsset"
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
            />
            Custom asset prepared for this clinic
          </label>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-400"
          >
            Add Clinic & Start Call
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
