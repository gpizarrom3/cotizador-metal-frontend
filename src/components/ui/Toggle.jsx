export default function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex w-11 h-6 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-slate-600'}`}
    >
      <span
        className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  )
}
