export default function PortfolioCarousel({ portfolios }) {
  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Belum ada portfolio</p>
      </div>
    );
  }

  return (
    <div className="port-grid">
      {portfolios.map((portfolio) => (
        <div key={portfolio.id} className="port-item">
          <img
            src={portfolio.image_url}
            alt={portfolio.title}
            className="port-thumb"
          />
          <div className="port-overlay">
            <div className="port-cat">{portfolio.service?.name}</div>
            <div className="port-name">{portfolio.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
