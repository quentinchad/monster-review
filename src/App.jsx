import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Accueil from './pages/Accueil'
import ListeMonsters from './pages/ListeMonsters'
import MonsterPage from './pages/MonsterPage'
import Classements from './pages/Classements'
import CreerReview from './pages/CreerReview'
import ModifierReview from './pages/ModifierReview'
import { Connexion, Inscription } from './pages/AuthPages'
import Profil from './pages/Profil'
import Admin from './pages/Admin'
import './assets/styles.css'
import './components/Shared.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Accueil />} />
            <Route path="monsters" element={<ListeMonsters />} />
            <Route path="monsters/:slug" element={<MonsterPage />} />
            <Route path="classements" element={<Classements />} />
            <Route path="review/nouveau" element={<CreerReview />} />
            <Route path="review/:id/modifier" element={<ModifierReview />} />
            <Route path="connexion" element={<Connexion />} />
            <Route path="inscription" element={<Inscription />} />
            <Route path="profil/:id" element={<Profil />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
