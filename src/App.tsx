import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomeView from './components/HomeView';
import ProjectView from './components/ProjectView';
import NewProjectModal from './components/NewProjectModal';
import CardDetectionModal from './components/CardDetectionModal';
import TagManager from './components/TagManager';

function App() {
  const {
    currentView,
    showNewProjectModal,
    showCardModal,
    showTagManager,
    setDetectedCard,
    setShowCardModal,
    setProjects,
    setRecentImages,
  } = useAppStore();

  useEffect(() => {
    // Load projects on startup
    loadData();

    // Listen for card detection
    window.electronAPI.onCardDetected((data) => {
      setDetectedCard(data);
      setShowCardModal(true);
    });

    return () => {
      window.electronAPI.removeCardDetectedListener();
    };
  }, []);

  const loadData = async () => {
    const projects = await window.electronAPI.getProjects();
    setProjects(projects);

    const images = await window.electronAPI.getRecentImages();
    setRecentImages(images);
  };

  return (
    <div className="flex flex-col h-screen bg-app-bg">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {currentView === 'home' ? <HomeView /> : <ProjectView />}
        </main>
      </div>

      {showNewProjectModal && <NewProjectModal />}
      {showCardModal && <CardDetectionModal />}
      {showTagManager && <TagManager />}
    </div>
  );
}

export default App;
