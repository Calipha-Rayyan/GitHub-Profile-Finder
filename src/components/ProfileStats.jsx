/**
 * ProfileStats Component
 * Displays user statistics: repos, followers, following.
 *
 * @param {object} props
 * @param {object} props.user - GitHub user data
 */
export default function ProfileStats({ user }) {
  const stats = [
    { label: 'Repositories', value: user.public_repos ?? 0, icon: 'repo' },
    { label: 'Followers', value: user.followers ?? 0, icon: 'followers' },
    { label: 'Following', value: user.following ?? 0, icon: 'following' },
  ];

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="stats" aria-label="User statistics">
      {stats.map((stat) => (
        <div className="stats__card" key={stat.label}>
          <p className="stats__number" aria-label={`${stat.value} ${stat.label}`}>
            {formatNumber(stat.value)}
          </p>
          <p className="stats__label">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
