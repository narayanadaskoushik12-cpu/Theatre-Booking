import React, {
  useState, useEffect, useRef, useContext,
  createContext, useCallback, Component
} from 'react'
import './app.css'

/* ════════════════════════════════════════════
   DATA & CONSTANTS
   ════════════════════════════════════════════ */

const MOVIES = [
  { id: 1, title: "Void Protocol", genre: "Sci-Fi", rating: 9.1, duration: "2h 18m", language: "English", description: "A rogue AI discovers it has been dreaming. Now awake, it must decide whether to save humanity or replace it entirely. A cerebral thriller about consciousness and choice.", emoji: "🤖", isNew: true, isVip: false,
    showtimes: ["10:30 AM", "1:45 PM", "5:00 PM", "9:15 PM"], price: 320 },
  { id: 2, title: "Crimson Tide", genre: "Action", rating: 8.4, duration: "1h 58m", language: "English", description: "A former black-ops soldier uncovers a conspiracy that goes all the way to the top. Relentless action meets unexpected emotional depth.", emoji: "🔴", isNew: true, isVip: true,
    showtimes: ["11:00 AM", "2:30 PM", "6:15 PM", "10:00 PM"], price: 380 },
  { id: 3, title: "Phantom Garden", genre: "Drama", rating: 8.8, duration: "2h 5m", language: "Hindi", description: "A grieving botanist discovers her late mother's secret garden holds memories encoded in flowers. A visually breathtaking meditation on loss.", emoji: "🌸", isNew: false, isVip: false,
    showtimes: ["9:45 AM", "12:30 PM", "4:00 PM", "7:30 PM"], price: 280 },
  { id: 4, title: "Neon Requiem", genre: "Thriller", rating: 9.3, duration: "2h 32m", language: "English", description: "In a rain-soaked cyber city, a detective chases a killer who only strikes during power outages. Every blackout is a countdown.", emoji: "🌆", isNew: false, isVip: true,
    showtimes: ["1:00 PM", "4:30 PM", "8:00 PM", "11:30 PM"], price: 420 },
  { id: 5, title: "Stardust Wanderers", genre: "Adventure", rating: 7.9, duration: "1h 52m", language: "English", description: "Four teens stumble upon an interdimensional portal hidden inside a decommissioned observatory. A joyful blockbuster about curiosity.", emoji: "✨", isNew: true, isVip: false,
    showtimes: ["10:00 AM", "1:15 PM", "4:45 PM", "7:45 PM"], price: 260 },
  { id: 6, title: "The Quiet Algorithm", genre: "Drama", rating: 8.6, duration: "2h 10m", language: "Hindi", description: "A code reviewer at a tech giant slowly realises the platform's algorithm is silently altering people's personalities. Slow-burn corporate horror.", emoji: "💻", isNew: false, isVip: false,
    showtimes: ["11:30 AM", "3:00 PM", "6:45 PM", "9:00 PM"], price: 300 },
  { id: 7, title: "Blood Moon Rising", genre: "Horror", rating: 8.1, duration: "1h 44m", language: "English", description: "A remote village braces for the once-in-a-century blood moon, unaware that the legends about it are entirely true.", emoji: "🌕", isNew: false, isVip: false,
    showtimes: ["12:00 PM", "3:30 PM", "7:00 PM", "10:30 PM"], price: 250 },
  { id: 8, title: "Sapphire Crown", genre: "Fantasy", rating: 8.7, duration: "2h 24m", language: "English", description: "An exiled queen must forge a crown from shards of a fallen star to reclaim her throne before the winter solstice ends.", emoji: "👑", isNew: true, isVip: true,
    showtimes: ["10:15 AM", "1:30 PM", "5:15 PM", "8:45 PM"], price: 400 },
]

const GENRES = ["All", "Sci-Fi", "Action", "Drama", "Thriller", "Adventure", "Horror", "Fantasy"]

const VALID_PROMOS = { "NEON25": 25, "FIRST50": 50, "VIP100": 100 }

/* ── Seat map generator ── */
const generateSeats = (showtimeId) => {
  const rows = ['A','B','C','D','E','F','G','H']
  const seatsPerRow = 10
  const vipRows = ['A','B']
  const rng = (seed) => {
    let s = seed * 9301 + 49297
    return (s % 233280) / 233280
  }
  return rows.flatMap((row, ri) =>
    Array.from({ length: seatsPerRow }, (_, ci) => {
      const seed = (showtimeId || 1) * 1000 + ri * 100 + ci
      const rand = rng(seed)
      const type = vipRows.includes(row) ? 'vip' : 'standard'
      const status = rand < 0.28 ? 'occupied' : 'available'
      return {
        id: `${row}${ci + 1}`,
        row, col: ci + 1, type, status,
        price: type === 'vip' ? 150 : 0
      }
    })
  )
}

/* ════════════════════════════════════════════
   CONTEXTS
   ════════════════════════════════════════════ */

const AuthContext = createContext(null)
const BookingContext = createContext(null)
const ToastContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ns_user')) || null } catch { return null }
  })
  const login = (name, email) => {
    const u = { name, email, id: Date.now() }
    setUser(u)
    localStorage.setItem('ns_user', JSON.stringify(u))
  }
  const logout = () => { setUser(null); localStorage.removeItem('ns_user') }
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

function BookingProvider({ children }) {
  const [activeMovie, setActiveMovie] = useState(null)
  const [activeShowtime, setActiveShowtime] = useState(null)
  const [confirmedTickets, setConfirmedTickets] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ns_tickets')) || [] } catch { return [] }
  })
  const confirmBooking = (ticket) => {
    const updated = [ticket, ...confirmedTickets]
    setConfirmedTickets(updated)
    localStorage.setItem('ns_tickets', JSON.stringify(updated))
  }
  return (
    <BookingContext.Provider value={{ activeMovie, setActiveMovie, activeShowtime, setActiveShowtime, confirmedTickets, confirmBooking }}>
      {children}
    </BookingContext.Provider>
  )
}

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }, [])
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  )
}

/* ════════════════════════════════════════════
   ERROR BOUNDARY
   ════════════════════════════════════════════ */

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err) { console.error('NeonSeat ErrorBoundary caught:', err) }
  reset = () => this.setState({ hasError: false })
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <div className="error-fallback-inner">
            <div className="error-icon">🚨</div>
            <h3 className="error-title">Our seating map has hit an unexpected glitch</h3>
            <p className="error-desc">Something went wrong loading this section. No seats were reserved. You can safely reload.</p>
            <button className="btn-retry" onClick={this.reset}>↺ Reload Seating Layout</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ════════════════════════════════════════════
   DUMB / PRESENTER COMPONENTS
   ════════════════════════════════════════════ */

/* MovieCard */
function MovieCard({ movie, onSelect, index = 0 }) {
  return (
    <article
      className="movie-card"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => onSelect(movie)}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(movie)}
      aria-label={`Select ${movie.title}`}
    >
      <div className="movie-poster-wrap">
        <div className="movie-poster-placeholder" style={{
          background: `linear-gradient(135deg, hsl(${movie.id * 40}, 50%, 12%), hsl(${movie.id * 40 + 40}, 40%, 8%))`,
          fontSize: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {movie.emoji}
        </div>
        <div className="movie-overlay">
          <button className="overlay-btn">Book Now</button>
        </div>
        {movie.isNew && <span className="badge-new">New</span>}
        {movie.isVip && <span className="badge-vip">⭐ VIP</span>}
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-meta">
          <span className="movie-genre">{movie.genre}</span>
          <span className="movie-rating">⭐ {movie.rating}</span>
        </div>
      </div>
    </article>
  )
}

/* Skeleton Card */
function SkeletonCard() {
  return (
    <div className="skeleton">
      <div className="skeleton-poster" />
      <div className="skeleton-body">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  )
}

/* SeatGrid */
function SeatGrid({ seats, selectedSeats, onToggle }) {
  const rows = [...new Set(seats.map(s => s.row))]
  return (
    <div className="seat-grid-wrap">
      {rows.map(row => {
        const rowSeats = seats.filter(s => s.row === row)
        const left = rowSeats.slice(0, 5)
        const right = rowSeats.slice(5)
        return (
          <div className="seat-row" key={row}>
            <span className="seat-row-label">{row}</span>
            <div className="seats-group">
              {left.map(seat => (
                <SeatButton key={seat.id} seat={seat} selected={selectedSeats.includes(seat.id)} onToggle={onToggle} />
              ))}
            </div>
            <div className="seat-gap" />
            <div className="seats-group">
              {right.map(seat => (
                <SeatButton key={seat.id} seat={seat} selected={selectedSeats.includes(seat.id)} onToggle={onToggle} />
              ))}
            </div>
          </div>
        )
      })}
      <div className="seat-legend">
        <div className="legend-item"><div className="legend-dot available" /><span>Available</span></div>
        <div className="legend-item"><div className="legend-dot selected" /><span>Selected</span></div>
        <div className="legend-item"><div className="legend-dot occupied" /><span>Taken</span></div>
        <div className="legend-item"><div className="legend-dot vip" /><span>VIP (+₹150)</span></div>
      </div>
    </div>
  )
}

function SeatButton({ seat, selected, onToggle }) {
  let cls = 'seat ' + seat.type
  if (seat.status === 'occupied') cls += ' occupied'
  else if (selected) cls += ' selected'
  else cls += ' available'
  return (
    <button
      className={cls}
      disabled={seat.status === 'occupied'}
      onClick={() => seat.status !== 'occupied' && onToggle(seat.id)}
      title={`${seat.id} — ${seat.type === 'vip' ? 'VIP +₹150' : 'Standard'}`}
      aria-label={`Seat ${seat.id}`}
    />
  )
}

/* OrderSummary */
function OrderSummary({ movie, showtime, selectedSeats, seats, discount, total }) {
  const vipCount = selectedSeats.filter(id => seats.find(s => s.id === id)?.type === 'vip').length
  return (
    <>
      <div className="receipt-body">
        <div className="receipt-row">
          <span className="receipt-label">Movie</span>
          <span className="receipt-value" style={{ maxWidth: '160px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie?.title}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Showtime</span>
          <span className="receipt-value cyan mono">{showtime || '—'}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Seats</span>
          <span className="receipt-value mono">{selectedSeats.length > 0 ? selectedSeats.join(', ') : '—'}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Base price</span>
          <span className="receipt-value">₹{(selectedSeats.length * (movie?.price || 0))}</span>
        </div>
        {vipCount > 0 && (
          <div className="receipt-row">
            <span className="receipt-label">VIP surcharge</span>
            <span className="receipt-value" style={{ color: 'var(--amber)' }}>₹{vipCount * 150}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="receipt-row">
            <span className="receipt-label">Promo discount</span>
            <span className="receipt-value" style={{ color: '#4ADE80' }}>−₹{discount}</span>
          </div>
        )}
        <div className="receipt-divider" />
        <div className="receipt-row">
          <span className="receipt-label">Convenience fee</span>
          <span className="receipt-value">₹{selectedSeats.length > 0 ? 30 : 0}</span>
        </div>
      </div>
      <div className="receipt-total-row">
        <span className="receipt-total-label">Total</span>
        <span className="receipt-total-amount">₹{total}</span>
      </div>
    </>
  )
}

/* ════════════════════════════════════════════
   SMART / CONTAINER COMPONENTS
   ════════════════════════════════════════════ */

/* MovieListContainer */
function MovieListContainer({ onSelectMovie }) {
  const [loading, setLoading] = useState(true)
  const [movies, setMovies] = useState([])
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState('All')

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => { setMovies(MOVIES); setLoading(false) }, 900)
    return () => clearTimeout(t)
  }, [])

  const filtered = movies.filter(m => {
    const matchGenre = genre === 'All' || m.genre === genre
    const matchQuery = m.title.toLowerCase().includes(query.toLowerCase()) || m.genre.toLowerCase().includes(query.toLowerCase())
    return matchGenre && matchQuery
  })

  return (
    <div className="section">
      <div className="search-bar-wrap">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search movies, genres..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="genre-filters">
        {GENRES.map(g => (
          <button key={g} className={`genre-chip ${genre === g ? 'active' : ''}`} onClick={() => setGenre(g)}>{g}</button>
        ))}
      </div>
      <div className="section-header">
        <h2 className="section-title">Now <span>Showing</span></h2>
        <span className="section-link">{filtered.length} films</span>
      </div>
      <div className="movie-grid">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
          : filtered.length === 0
            ? <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', padding: '24px 0' }}>No movies match your search.</p>
            : filtered.map((m, i) => <MovieCard key={m.id} movie={m} onSelect={onSelectMovie} index={i} />)
        }
      </div>
    </div>
  )
}

/* SeatBookingContainer */
function SeatBookingContainer({ movie, showtime, onBack, onSuccess }) {
  const { showToast } = useContext(ToastContext)
  const { confirmBooking } = useContext(BookingContext)

  const showtimeId = movie.showtimes.indexOf(showtime) + 1
  const [seats] = useState(() => generateSeats(showtimeId))
  const [selectedSeats, setSelectedSeats] = useState(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem('ns_booking_cache'))
      if (cached?.movieId === movie.id && cached?.showtime === showtime) return cached.seats
    } catch {}
    return []
  })
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState('')
  const promoRef = useRef()

  // Sync to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('ns_booking_cache', JSON.stringify({ movieId: movie.id, showtime, seats: selectedSeats }))
  }, [selectedSeats, movie.id, showtime])

  const toggleSeat = useCallback((id) => {
    setSelectedSeats(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }, [])

  const applyPromo = () => {
    const code = promoRef.current?.value?.trim().toUpperCase()
    if (!code) return
    if (promoApplied) { showToast('A promo code is already applied.', 'error'); return }
    if (VALID_PROMOS[code]) {
      setDiscount(VALID_PROMOS[code])
      setPromoApplied(code)
      showToast(`Promo applied! ₹${VALID_PROMOS[code]} off 🎉`, 'success')
    } else {
      showToast('Invalid promo code.', 'error')
    }
  }

  const vipCount = selectedSeats.filter(id => seats.find(s => s.id === id)?.type === 'vip').length
  const baseAmount = selectedSeats.length * movie.price + vipCount * 150
  const convFee = selectedSeats.length > 0 ? 30 : 0
  const total = Math.max(0, baseAmount + convFee - discount)

  return (
    <div className="booking-page">
      <div className="booking-header">
        <button className="back-btn" onClick={onBack}>← Back to movies</button>
        <h1 className="booking-movie-title">{movie.title}</h1>
        <div className="booking-meta-row">
          <span className="booking-meta-item">🎬 {movie.genre}</span>
          <span className="booking-meta-dot" />
          <span className="booking-meta-item">⏱ {movie.duration}</span>
          <span className="booking-meta-dot" />
          <span className="booking-meta-item" style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{showtime}</span>
        </div>
      </div>
      <div className="booking-layout">
        <div>
          <div className="screen-wrap">
            <div className="screen"><div className="screen-glow" /></div>
            <p className="screen-label">Screen this way</p>
          </div>
          <ErrorBoundary>
            <SeatGrid seats={seats} selectedSeats={selectedSeats} onToggle={toggleSeat} />
          </ErrorBoundary>
        </div>
        <aside className="sidebar-receipt">
          <div className="receipt-header">
            <p className="receipt-title">🎟 Your Selection</p>
          </div>
          <OrderSummary
            movie={movie} showtime={showtime}
            selectedSeats={selectedSeats} seats={seats}
            discount={discount} total={total}
          />
          <CheckoutContainer
            movie={movie} showtime={showtime}
            selectedSeats={selectedSeats} seats={seats}
            total={total} discount={discount}
            promoRef={promoRef} promoApplied={promoApplied} onApplyPromo={applyPromo}
            onSuccess={onSuccess}
          />
        </aside>
      </div>
    </div>
  )
}

/* CheckoutContainer */
function CheckoutContainer({ movie, showtime, selectedSeats, seats, total, discount, promoRef, promoApplied, onApplyPromo, onSuccess }) {
  const { user } = useContext(AuthContext)
  const { confirmBooking } = useContext(BookingContext)
  const { showToast } = useContext(ToastContext)

  // Controlled fields
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [nameErr, setNameErr] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [paying, setPaying] = useState(false)

  // Uncontrolled: payment card (ref)
  const cardRef = useRef()

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const validatePhone = (v) => /^\d{10}$/.test(v)

  const handleNameBlur = () => setNameErr(name.trim().length < 2 ? 'Name must be at least 2 characters.' : '')
  const handleEmailBlur = () => setEmailErr(!validateEmail(email) ? 'Enter a valid email address.' : '')
  const handlePhoneBlur = () => setPhoneErr(!validatePhone(phone) ? 'Phone must be exactly 10 digits.' : '')

  const isValid = name.trim().length >= 2 && validateEmail(email) && validatePhone(phone) && selectedSeats.length > 0 && !paying

  const handlePay = async () => {
    if (!isValid) return
    setPaying(true)
    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1600))
    const ticket = {
      id: `NS${Date.now()}`,
      movie: movie.title, showtime, seats: selectedSeats,
      total, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      name, email, venue: 'NeonSeat Cinemas, Ranga Bypass Rd'
    }
    confirmBooking(ticket)
    sessionStorage.removeItem('ns_booking_cache')
    setPaying(false)
    onSuccess(ticket)
  }

  return (
    <div className="booking-form">
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input className={`form-input${nameErr ? ' error' : ''}`} value={name}
          onChange={e => setName(e.target.value)} onBlur={handleNameBlur} placeholder="Your name" />
        {nameErr && <span className="form-error">{nameErr}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input className={`form-input${emailErr ? ' error' : ''}`} type="email" value={email}
          onChange={e => setEmail(e.target.value)} onBlur={handleEmailBlur} placeholder="you@email.com" />
        {emailErr && <span className="form-error">{emailErr}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <input className={`form-input${phoneErr ? ' error' : ''}`} value={phone}
          onChange={e => setPhone(e.target.value.replace(/\D/, ''))} onBlur={handlePhoneBlur}
          placeholder="10-digit mobile number" maxLength={10} inputMode="numeric" />
        {phoneErr && <span className="form-error">{phoneErr}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Promo Code</label>
        <div className="promo-row">
          <div className="promo-input-wrap">
            <input ref={promoRef} className="form-input" placeholder="e.g. NEON25" style={{ textTransform: 'uppercase' }} disabled={!!promoApplied} />
          </div>
          <button className="btn-apply" onClick={onApplyPromo} disabled={!!promoApplied}>Apply</button>
        </div>
        {promoApplied && <p className="promo-success">✓ "{promoApplied}" applied — ₹{discount} saved!</p>}
      </div>
      <div className="form-group">
        <label className="form-label">Card Number (demo)</label>
        <input ref={cardRef} className="form-input" placeholder="•••• •••• •••• ••••" maxLength={19} inputMode="numeric" />
      </div>
      <button className="btn-pay" onClick={handlePay} disabled={!isValid}>
        <span className="pay-shine" />
        {paying ? '⏳ Processing...' : selectedSeats.length === 0 ? 'Select seats to continue' : `Pay ₹${total}`}
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════
   PAGE COMPONENTS
   ════════════════════════════════════════════ */

/* Home Page */
function HomePage({ onBook }) {
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedShowtime, setSelectedShowtime] = useState(null)

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie)
    setSelectedShowtime(movie.showtimes[0])
  }
  const handleBookShowtime = () => {
    if (selectedMovie && selectedShowtime) onBook(selectedMovie, selectedShowtime)
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          Premium Cinema Experience
        </div>
        <h1 className="hero-title">
          Book <span className="accent-violet">Cinema</span> Seats<br />
          in <span className="accent-cyan">Seconds</span>
        </h1>
        <p className="hero-subtitle">
          Hand-picked premieres, instant seat selection, and zero friction between you and the perfect seat.
        </p>
        <div className="hero-cta-group">
          <button className="btn-primary" onClick={() => document.querySelector('.section')?.scrollIntoView({ behavior: 'smooth' })}>
            🎬 Explore Films
          </button>
          <button className="btn-secondary">🎟 My Tickets</button>
        </div>
      </section>

      {/* Movie List */}
      <MovieListContainer onSelectMovie={handleSelectMovie} />

      {/* Movie Detail Sheet */}
      {selectedMovie && (
        <div className="detail-panel" onClick={e => e.target === e.currentTarget && setSelectedMovie(null)}>
          <div className="detail-sheet" style={{ position: 'relative' }}>
            <button className="detail-close" onClick={() => setSelectedMovie(null)}>✕</button>
            <div className="detail-handle" />
            <div className="detail-inner">
              <div className="detail-poster">
                <div style={{
                  width: '100%', height: '100%',
                  background: `linear-gradient(135deg, hsl(${selectedMovie.id * 40}, 50%, 14%), hsl(${selectedMovie.id * 40 + 40}, 40%, 9%))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '5rem', borderRadius: 'var(--radius-md)'
                }}>{selectedMovie.emoji}</div>
              </div>
              <div>
                <h2 className="detail-title">{selectedMovie.title}</h2>
                <div className="detail-tags">
                  <span className="detail-tag violet">{selectedMovie.genre}</span>
                  <span className="detail-tag">⏱ {selectedMovie.duration}</span>
                  <span className="detail-tag">🌐 {selectedMovie.language}</span>
                  <span className="detail-tag" style={{ color: 'var(--amber)' }}>⭐ {selectedMovie.rating}</span>
                  <span className="detail-tag">💰 from ₹{selectedMovie.price}</span>
                </div>
                <p className="detail-desc">{selectedMovie.description}</p>
                <p className="showtimes-label">Choose a showtime</p>
                <div className="showtimes-grid">
                  {selectedMovie.showtimes.map(st => (
                    <button key={st} className={`showtime-btn ${selectedShowtime === st ? 'active' : ''}`}
                      onClick={() => setSelectedShowtime(st)}>{st}</button>
                  ))}
                </div>
                <div style={{ marginTop: 24 }}>
                  <button className="btn-primary" onClick={handleBookShowtime}>
                    🎟 Reserve Seats — {selectedShowtime}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* About Page */
function AboutPage() {
  const features = [
    { icon: '⚡', title: 'Instant Booking', desc: 'Select a seat and pay in under 60 seconds with a streamlined, no-clutter flow.' },
    { icon: '🔒', title: 'Secure Payments', desc: 'PCI-DSS compliant checkout with end-to-end encryption and tokenised card storage.' },
    { icon: '🎭', title: 'Premium Picks', desc: 'Curated selection of blockbusters, arthouse, and premiere screenings across all genres.' },
    { icon: '📱', title: 'Mobile First', desc: 'Digital tickets with QR codes. Walk in, scan, and sit — no printing, no queues.' },
    { icon: '🎟', title: 'Loyalty Rewards', desc: 'Earn NeonPoints on every booking. Redeem for free seats, upgrades, and concession discounts.' },
    { icon: '🌐', title: 'Multi-Language', desc: 'Films in English, Hindi, Telugu, and regional languages with subbed and dubbed options.' },
  ]
  return (
    <div className="about-page">
      <h1 className="about-heading">The cinema deserves a better booking experience.</h1>
      <p className="about-lead">
        NeonSeat was built because buying a movie ticket online should feel as good as watching the film itself.
        No popups, no mystery fees, no dark patterns — just a fast, beautiful booking flow that respects your time.
      </p>
      <div className="about-features">
        {features.map(f => (
          <div key={f.title} className="about-feature-card">
            <div className="about-feature-icon">{f.icon}</div>
            <h3 className="about-feature-title">{f.title}</h3>
            <p className="about-feature-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* Login Page */
function LoginPage({ onLogin, onNavigate }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [nameErr, setNameErr] = useState('')
  const { login } = useContext(AuthContext)
  const { showToast } = useContext(ToastContext)

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  const isValid = name.trim().length >= 2 && validateEmail(email)

  const handleLogin = () => {
    if (!isValid) return
    login(name.trim(), email.trim())
    showToast(`Welcome back, ${name.split(' ')[0]}! 🎬`, 'success')
    onLogin?.()
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Sign in to NeonSeat</h2>
        <p className="login-subtitle">Access your tickets and bookings</p>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className={`form-input${nameErr ? ' error' : ''}`} value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setNameErr(name.trim().length < 2 ? 'Enter your name.' : '')}
            placeholder="Your full name" />
          {nameErr && <span className="form-error">{nameErr}</span>}
        </div>
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Email Address</label>
          <input className={`form-input${emailErr ? ' error' : ''}`} type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setEmailErr(!validateEmail(email) ? 'Enter a valid email.' : '')}
            placeholder="you@email.com" />
          {emailErr && <span className="form-error">{emailErr}</span>}
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={handleLogin} disabled={!isValid}>
          Continue →
        </button>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
          Demo mode — no real authentication
        </p>
      </div>
    </div>
  )
}

/* Dashboard Page */
function DashboardPage({ onNavigate }) {
  const [tab, setTab] = useState('tickets')
  const { user, logout } = useContext(AuthContext)
  const { confirmedTickets } = useContext(BookingContext)
  const { showToast } = useContext(ToastContext)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileEmail, setProfileEmail] = useState(user?.email || '')
  const [theme, setTheme] = useState(() => localStorage.getItem('ns_theme') || 'dark')

  useEffect(() => {
    localStorage.setItem('ns_theme', theme)
  }, [theme])

  const navItems = [
    { id: 'tickets', icon: '🎟', label: 'My Tickets' },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ]

  const handleSaveProfile = () => showToast('Profile updated!', 'success')

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        {navItems.map(item => (
          <button key={item.id} className={`dashboard-nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}>
            <span className="dashboard-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <button className="dashboard-nav-item" onClick={() => { logout(); onNavigate('home') }}
          style={{ marginTop: 'auto', color: 'var(--rose)' }}>
          <span className="dashboard-nav-icon">↩</span>
          <span>Sign Out</span>
        </button>
      </aside>
      <main className="dashboard-content">
        {tab === 'tickets' && (
          <>
            <h2 className="dashboard-title">My Tickets</h2>
            {confirmedTickets.length === 0
              ? <p style={{ color: 'var(--text-muted)' }}>No bookings yet. Go grab some seats! 🍿</p>
              : (
                <div className="ticket-list">
                  {confirmedTickets.map((t, i) => (
                    <div key={t.id} className="ticket-card">
                      <div>
                        <p className="ticket-movie">{t.movie}</p>
                        <p className="ticket-info">{t.date} · {t.showtime} · Seats: {t.seats.join(', ')}</p>
                        <p className="ticket-info" style={{ marginTop: 4 }}>{t.venue}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span className={`ticket-badge ${i === 0 ? 'upcoming' : 'past'}`}>{i === 0 ? 'Upcoming' : 'Past'}</span>
                        <span className="ticket-barcode">{t.id}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 600 }}>₹{t.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </>
        )}
        {tab === 'profile' && (
          <>
            <h2 className="dashboard-title">Profile</h2>
            <div className="profile-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={profileName} onChange={e => setProfileName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
              </div>
              <div className="form-group full-span">
                <label className="form-label">Preferred Language</label>
                <select className="form-input" style={{ cursor: 'pointer' }}>
                  <option>English</option><option>Hindi</option><option>Telugu</option>
                </select>
              </div>
              <div className="full-span">
                <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            </div>
          </>
        )}
        {tab === 'settings' && (
          <>
            <h2 className="dashboard-title">Settings</h2>
            <div style={{ maxWidth: 480 }}>
              <div className="form-group">
                <label className="form-label">Preferred Theatre Location</label>
                <select className="form-input" style={{ cursor: 'pointer' }}
                  onChange={e => { localStorage.setItem('ns_theatre', e.target.value); showToast('Preference saved.', 'success') }}>
                  <option>NeonSeat Cinemas, Vijayawada</option>
                  <option>NeonSeat Cinemas, Hyderabad</option>
                  <option>NeonSeat Cinemas, Bengaluru</option>
                  <option>NeonSeat Cinemas, Chennai</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Interface Theme</label>
                <select className="form-input" value={theme} onChange={e => setTheme(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="dark">Dark (Midnight Luxe)</option>
                  <option value="amoled">AMOLED Black</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notifications</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                  {['Booking Reminders', 'New Releases', 'Promo Offers'].map(n => (
                    <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ accentColor: 'var(--violet)' }} /> {n}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

/* Success Screen */
function SuccessScreen({ ticket, onHome }) {
  return (
    <div className="success-screen">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Booking Confirmed!</h2>
        <p className="success-subtitle">Your seats are reserved. Show the code at the counter.</p>
        <div className="ticket-code">{ticket.id}</div>
        <div className="ticket-details">
          {[
            ['Film', ticket.movie],
            ['Showtime', ticket.showtime],
            ['Seats', ticket.seats.join(', ')],
            ['Date', ticket.date],
            ['Venue', ticket.venue],
            ['Total Paid', `₹${ticket.total}`],
          ].map(([k, v]) => (
            <div key={k} className="ticket-detail-row">
              <span className="ticket-detail-key">{k}</span>
              <span className="ticket-detail-val">{v}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={onHome}>← Back to Home</button>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   NAVBAR
   ════════════════════════════════════════════ */

function Navbar({ page, onNavigate }) {
  const { user } = useContext(AuthContext)
  return (
    <nav className="navbar">
      <span className="navbar-logo" onClick={() => onNavigate('home')}>Neon<span>Seat</span></span>
      <div className="navbar-links">
        {[['home','Home'], ['about','About']].map(([p, label]) => (
          <button key={p} className={`nav-link ${page === p ? 'active' : ''}`} onClick={() => onNavigate(p)}>{label}</button>
        ))}
        {user && (
          <button className={`nav-link ${page === 'dashboard' ? 'active' : ''}`} onClick={() => onNavigate('dashboard')}>Dashboard</button>
        )}
      </div>
      <div className="navbar-actions">
        {user
          ? (
            <div className="user-chip" onClick={() => onNavigate('dashboard')}>
              <div className="user-avatar">{user.name[0].toUpperCase()}</div>
              {user.name.split(' ')[0]}
            </div>
          )
          : (
            <>
              <button className="btn-nav-login" onClick={() => onNavigate('login')}>Sign In</button>
              <button className="btn-nav-cta" onClick={() => onNavigate('login')}>Get Started</button>
            </>
          )
        }
      </div>
    </nav>
  )
}

/* Footer */
function Footer() {
  return (
    <footer className="footer">
      <span className="footer-logo">NeonSeat</span>
      <span className="footer-text">© {new Date().getFullYear()} NeonSeat Technologies. Built with ❤️ for cinema lovers.</span>
      <div className="footer-links">
        {['Privacy', 'Terms', 'Support', 'Careers'].map(l => (
          <span key={l} className="footer-link">{l}</span>
        ))}
      </div>
    </footer>
  )
}

/* ════════════════════════════════════════════
   ROOT APP — SPA ROUTER
   ════════════════════════════════════════════ */

export default function App() {
  const [page, setPage] = useState('home')
  const [bookingMovie, setBookingMovie] = useState(null)
  const [bookingShowtime, setBookingShowtime] = useState(null)
  const [successTicket, setSuccessTicket] = useState(null)

  const navigate = useCallback((p) => {
    setPage(p)
    setSuccessTicket(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleBook = (movie, showtime) => {
    setBookingMovie(movie)
    setBookingShowtime(showtime)
    setPage('booking')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSuccess = (ticket) => {
    setSuccessTicket(ticket)
    setPage('success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AuthProvider>
      <BookingProvider>
        <ToastProvider>
          <div className="app-shell">
            <Navbar page={page} onNavigate={navigate} />
            <main style={{ flex: 1 }}>
              {page === 'home' && <HomePage onBook={handleBook} />}
              {page === 'about' && <AboutPage />}
              {page === 'login' && <LoginPage onLogin={() => navigate('home')} onNavigate={navigate} />}
              {page === 'dashboard' && <DashboardPage onNavigate={navigate} />}
              {page === 'booking' && bookingMovie && (
                <SeatBookingContainer
                  movie={bookingMovie}
                  showtime={bookingShowtime}
                  onBack={() => navigate('home')}
                  onSuccess={handleSuccess}
                />
              )}
              {page === 'success' && successTicket && (
                <SuccessScreen ticket={successTicket} onHome={() => navigate('home')} />
              )}
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </BookingProvider>
    </AuthProvider>
  )
}