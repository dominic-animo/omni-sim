export type HistoryCard = {
  name: string;
  role: string;
  href: string;
  image: string;
  kind?: string;
};

export type HistoryLink = {
  label: string;
  href: string;
};

export function HistoryGallery({ items }: { items: HistoryCard[] }) {
  return (
    <div className="historyGallery">
      {items.map((item) => (
        <article className="historyCard" data-kind={item.kind} key={`${item.name}-${item.href}`}>
          <a className="historyImageLink" href={item.href} target="_blank" rel="noreferrer" aria-label={item.name}>
            <img
              className="historyImage"
              src={item.image}
              alt={item.name}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </a>
          <div className="historyCardBody">
            <span className="historyKind">{item.kind ?? "History"}</span>
            <a className="historyName" href={item.href} target="_blank" rel="noreferrer">
              {item.name}
            </a>
            <span className="historyRole">{item.role}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HistoryLinks({ links }: { links: HistoryLink[] }) {
  return (
    <p>
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? ", " : ""}
          <a href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        </span>
      ))}
      .
    </p>
  );
}
