export default function Card({ 
  children, 
  className = '',
  hover = false,
  padding = true,
  ...props 
}) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]
        ${padding ? 'p-6' : ''}
        ${hover ? 'hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-shadow duration-300 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = '' }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
};

Card.Title = function CardTitle({ children, className = '' }) {
  return <h3 className={`font-heading text-xl font-semibold ${className}`}>{children}</h3>;
};

Card.Description = function CardDescription({ children, className = '' }) {
  return <p className={`text-[#6B7280] text-sm mt-1 ${className}`}>{children}</p>;
};

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>;
};