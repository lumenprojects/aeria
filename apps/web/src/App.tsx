import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import EpisodesPage from "./pages/EpisodesPage";
import EpisodeDetailPage from "./pages/EpisodeDetailPage";
import CharactersPage from "./pages/CharactersPage";
import CharacterDetailPage from "./pages/CharacterDetailPage";
import AtlasPage from "./pages/AtlasPage";
import AtlasDetailPage from "./pages/AtlasDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="episodes" element={<EpisodesPage />} />
        <Route path="episodes/:slug" element={<EpisodeDetailPage />} />
        <Route path="characters" element={<CharactersPage />} />
        <Route path="characters/:slug" element={<CharacterDetailPage />} />
        <Route path="atlas" element={<AtlasPage />} />
        <Route path="atlas/:slug" element={<AtlasDetailPage />} />
      </Route>
    </Routes>
  );
}
