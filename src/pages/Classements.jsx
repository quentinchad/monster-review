import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { rankingsAPI } from '../services/api'
import { RatingBadge, Spinner, ErrorMsg } from '../components/Shared'
import './Classements.css'

export default function Classements() {
  const [rankings, setRankings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overall')

  useEffect(() => {
    rankingsAPI.get({ limit: 10 })
      .then(r => setRankings(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { key: 'overall', label: '🏆 Meilleure note globale', type: 'green' },
    { key: 'taste',   label: '👅 Meilleur goût',          type: 'gold' },
    { key: 'aura',    label: '✨ Meilleure aura canette',  type: 'blue' },
  ]

  return (
    <div className="page">
      <div className="container">
        <div className="section-title">
          <h1>CLASSEMENTS <span className="accent">MONSTER</span></h1>
        </div>
        <p className="rankings-intro">Classements mis à jour en temps réel selon les reviews de la communauté.</p>

        <div className="rankings-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ErrorMsg message={error} />

        {loading ? (
          <Spinner />
        ) : (
          tabs.map(t => activeTab === t.key && (
            <RankingList
              key={t.key}
              drinks={rankings?.[t.key] || []}
              field={t.key}
              type={t.type}
            />
          ))
        )}
      </div>
    </div>
  )
}

function RankingList({ drinks, field, type }) {
  if (!drinks.length) {
    return (
      <div className="empty-state">
        <span>☣</span>
        <p>Pas encore assez de reviews pour établir un classement.</p>
      </div>
    )
  }

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="ranking-list">
      {drinks.map((drink, i) => (
        <Link to={`/monsters/${drink.slug}`} key={drink.id} className="ranking-item card">
          <div className="ranking-pos">
            {i < 3 ? <span className="medal">{medals[i]}</span> : <span className="rank-num">#{i + 1}</span>}
          </div>
          <div className="ranking-img">
            {drink.image
              ? <img src={drink.image} alt={drink.name} />
              : <span className="ranking-placeholder">☣</span>
            }
          </div>
          <div className="ranking-info">
            <h3>{drink.name}</h3>
            <span className={`tag tag-${drink.status}`}>
              {drink.status === 'active' ? 'Disponible' : 'Discontinuée'}
            </span>
          </div>
          <div className="ranking-score">
            <RatingBadge value={drink.score} type={type} size="lg" />
            <span className="ranking-count">{drink.review_count} review{drink.review_count > 1 ? 's' : ''}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
