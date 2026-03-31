export default function SrmCheckboxItem({ label, name, form, handleInputChange }) {
  const isChecked = !!form[name];
  
  return (
    <label className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer select-none shadow-sm ${
      isChecked
        ? 'border-accent bg-accent/5' 
        : 'border-line hover:border-slate-300 bg-white'
    }`}>
      <div className={`w-5 h-5 flex flex-shrink-0 justify-center items-center mr-3 rounded-md border transition-all ${
        isChecked 
          ? 'bg-accent border-accent' 
          : 'border-slate-300 bg-slate-50'
      }`}>
        {isChecked && (
          <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 20 20">
            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
          </svg>
        )}
      </div>
      <input 
        type="checkbox" 
        name={name} 
        checked={isChecked} 
        onChange={handleInputChange} 
        className="hidden" 
      />
      <span className="text-sm font-bold text-slate-700">{label}</span>
    </label>
  );
}
