import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Wiki from './screens/Wiki';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="app">
      <div className="title">PYXIE</div>
      <div className="subtitle">Field Guide · Encyclopedia</div>
      <div className="screen"><div className="screen-inner"><Wiki /></div></div>
      <nav className="nav">
        <div className="nav-inner">
          <a className="nav-btn" href="/">Back to app</a>
        </div>
      </nav>
    </div>
  </StrictMode>
);
