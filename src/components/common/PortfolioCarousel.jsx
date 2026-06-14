const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}/${url}`;
};

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
            src={getImageUrl(portfolio.image_url)}
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
