import React from 'react';

export const DashboardPreview = () => {
  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Industrial/Water Background Image */}
      <img 
        src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop" 
        alt="Industrial Infrastructure" 
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
};
