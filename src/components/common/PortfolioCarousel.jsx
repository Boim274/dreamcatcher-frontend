import OptimizedImage from '../ui/OptimizedImage';

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
          <OptimizedImage
            src={portfolio.image_url}
            thumbnailSrc={portfolio.thumbnail_url}
            mediumSrc={portfolio.medium_url}
            variant="medium"
            alt={portfolio.title}
            containerClassName="w-full h-full"
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
