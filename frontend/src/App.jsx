import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './socket';
import Navbar from './components/Navbar';
import ScrollProgress from './components/ScrollProgress';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import TrainSearch from './pages/TrainSearch';
import About from './pages/About';
import Developer from './pages/Developer';
import Learner from './pages/Learner';
import LearnerBackend from './pages/LearnerBackend';
import LearnerFrontend from './pages/LearnerFrontend';
import WhatsNext from './pages/WhatsNext';
import AdminDashboard from './pages/AdminDashboard';
import OwnerOnlyRoute from './components/OwnerOnlyRoute';
import OfflineBanner from './components/OfflineBanner';

export default function App() {
  const location = useLocation();

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
          <Route path="/trains" element={<PageTransition><TrainSearch /></PageTransition>} />
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/developer" element={<PageTransition><Developer /></PageTransition>} />
          <Route path="/learner" element={<OwnerOnlyRoute><PageTransition><Learner /></PageTransition></OwnerOnlyRoute>} />
          <Route path="/learner/backend" element={<OwnerOnlyRoute><PageTransition><LearnerBackend /></PageTransition></OwnerOnlyRoute>} />
          <Route path="/learner/frontend" element={<OwnerOnlyRoute><PageTransition><LearnerFrontend /></PageTransition></OwnerOnlyRoute>} />
          <Route path="/whats-next" element={<PageTransition><WhatsNext /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      <OfflineBanner />
    </>
  );
}
