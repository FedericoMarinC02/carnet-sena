import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import * as htmlToImage from 'html-to-image';
import './App.css';
import senaLogo from './img/image.png';

const buildPlaceholder = (nombres = '', apellidos = '') => {
  const initials =
    `${nombres} ${apellidos}`
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'SN';

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'><rect width='512' height='512' rx='40' fill='#00a651'/><text x='50%' y='55%' font-size='200' fill='white' text-anchor='middle' font-family='Arial, sans-serif' dominant-baseline='middle'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};



const normalizeRow = (row, idx) => {
  const safe = (value) => (value ?? '').toString().trim();
  const id = safe(row.id) || `${Date.now()}-${idx}`;
  const nombres = safe(row.nombres) || safe(row.nombre) || '';
  const apellidos = safe(row.apellidos) || '';
  const fallbackFoto = buildPlaceholder(nombres, apellidos);
  return {
    id,
    tipo: safe(row.tipo) || 'APRENDIZ',
    centro: safe(row.centro) || safe(row.centro_formacion) || '',
    tipo_sangre: safe(row.rh) || safe(row.tipo_sangre) || '',
    documento: safe(row.documento) || safe(row.doc) || id,
    nombres,
    apellidos,
    telefono: safe(row.telefono) || '',
    ficha: safe(row.ficha) || safe(row.codigo_ficha) || '',
    empresa: safe(row.empresa) || 'SENA',
    activo: true,
    regional: safe(row.regional) || '',
    foto: safe(row.foto) || safe(row.foto_url) || fallbackFoto,
  };
};

const PersonCard = ({ person, qrBase, tick, registerRef, onDownload }) => (
  <div className="card-wrap">
    <article className="card" ref={(el) => registerRef(person.id, el)}>
      <div className="card-left">
        <img src={senaLogo} alt="SENA" className="card-logo" />
        <div className="qr-box">
          <QRCodeSVG
            value={`${qrBase}/#/persona/${person.id}?tok=${tick}`}
            size={160}
            level="M"
            includeMargin
          />
        </div>
      </div>
      <div className="card-body">
        <div className="card-names">
          <h3 className="role title">{person.tipo || 'APRENDIZ'}</h3>
          <h3 className="name-strong">{person.nombres}</h3>
          <h3 className="name-strong">{person.apellidos}</h3>
        </div>
        <div className="meta">
          <div>Doc: {person.documento}</div>
          <div>RH: {person.tipo_sangre || '—'}</div>
          <div>Regional: {person.regional || '—'}</div>
          <div className="center-text">{person.centro || 'Centro de procesos Industriales y Construcción'}</div>
        </div>
      </div>
      <div className="avatar-box">
        {person.foto ? (
          <img src={person.foto} alt={person.nombres} className="avatar rounded" />
        ) : (
          <div className="avatar placeholder">Foto</div>
        )}
      </div>
    </article>
    <div className="card-actions">
      <button className="ghost-btn" onClick={() => onDownload(person.id)}>Descargar</button>
    </div>
  </div>
);

function GridView({
  filtered,
  centros,
  search,
  setSearch,
  centro,
  setCentro,
  statusMessage,
  handleUpload,
  qrBase,
  setQrBase,
  tick,
  registerRef,
  onDownload,
}) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img src={senaLogo} alt="SENA" className="sena-logo" />
          <div>
            <p className="brand-title">Generador de Carnets</p>
            <p className="brand-sub">Base de datos: personas / fichas</p>
          </div>
        </div>
        <div className="actions">
          <label className="upload-btn">
            Importar PDF / Excel
            <input type="file" accept=".xls,.xlsx,.csv,.pdf" onChange={handleUpload} />
          </label>
          <div className="qrbase">
            <span className="label small">Base QR</span>
            <input
              className="input"
              value={qrBase}
              onChange={(e) => setQrBase(e.target.value.trim())}
              placeholder="https://tu-dominio-o-ip:3000"
            />
          </div>
          <div className="status">QR rota cada 30s · ventana {tick}</div>

          {statusMessage && <span className="status">{statusMessage}</span>}
        </div>
      </header>

      <section className="filters">
        <div>
          <label className="label">Buscar por nombre</label>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: Jimmy, Alexander..."
          />
        </div>
        <div>
          <label className="label">Filtrar por centro</label>
          <select className="input" value={centro} onChange={(e) => setCentro(e.target.value)}>
            {centros.map((c) => (
              <option key={c} value={c}>
                {c === 'todos' ? 'Todos los centros' : c}
              </option>
            ))}
          </select>
        </div>
        <div className="count">Total mostrados: {filtered.length}</div>
      </section>

      <section className="cards-grid">
        {filtered.map((person) => (
          <PersonCard
            key={person.id}
            person={person}
            qrBase={qrBase}
            tick={tick}
            registerRef={registerRef}
            onDownload={onDownload}
          />
        ))}
      </section>
    </>
  );
}

const getOrigin = () =>
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : '';

const getApiBase = () => process.env.REACT_APP_API_URL || getOrigin();

function DetailView({ people, tick, qrBase, registerRef, onDownload }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const apiBase = getApiBase();

  const [person, setPerson] = useState(
    people.find((p) => p.id.toString() === id.toString()),
  );

  useEffect(() => {
    if (person) return;
    const fetchOne = async () => {
      try {
        const res = await fetch(`${apiBase}/personas/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setPerson(normalizeRow(data, 0));
      } catch (e) {
        console.error('fetch persona', e);
      }
    };
    fetchOne();
  }, [apiBase, id, person]);
  const token = parseInt(params.get('tok') || '0', 10);
  const currentTick = Math.floor(Date.now() / 30000);
  const tokenValid = Math.abs(token - currentTick) <= 1; // 30s de tolerancia

  if (!person) {
    return (
      <div className="page">
        <p className="status">No se encontró la persona.</p>
        <button className="upload-btn" onClick={() => navigate('/')}>Volver</button>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="page">
        <p className="status">QR expirado o token ausente. Pide uno vigente.</p>
        <button className="upload-btn" onClick={() => navigate('/')}>Volver</button>
      </div>
    );
  }

  return (
    <div className="page">
      <button className="upload-btn" onClick={() => navigate('/')}>← Volver</button>
      <div className="cards-grid single">
        <PersonCard
          person={person}
          qrBase={qrBase}
          tick={tick}
          registerRef={registerRef}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
}

function App() {
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [centro, setCentro] = useState('todos');
  const [statusMessage, setStatusMessage] = useState('');
  const [qrBase, setQrBase] = useState(
    (typeof window !== 'undefined' && localStorage.getItem('qrBase')) || 'https://stellular-alpaca-6d15b2.netlify.app'
  );
  const [tick, setTick] = useState(Math.floor(Date.now() / 30000));
  const cardRefs = useRef(new Map());

  const registerRef = (id, node) => {
    const map = cardRefs.current;
    if (!node) {
      map.delete(id);
    } else {
      map.set(id, node);
    }
  };

  const onDownload = async (id) => {
    const node = cardRefs.current.get(id);
    if (!node) return;
    const dataUrl = await htmlToImage.toPng(node, { pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `carnet-${id}.png`;
    link.href = dataUrl;
    link.click();
  };

  useEffect(() => {
    const apiBase =
      process.env.REACT_APP_API_URL ||
      getApiBase() ||
      'https://carnet-sena.onrender.com';

    const fetchFromApi = async () => {
      try {
        const url = `${apiBase}/personas`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        if (!list.length) throw new Error('API sin datos');
        setPeople(list.map((d, idx) => normalizeRow(d, idx)));
        setStatusMessage(`Datos cargados desde API (${list.length})`);
        return true;
      } catch (error) {
        console.error('Error al cargar los datos desde la API:', error);
        setStatusMessage('Error consultando API. Intentando CSV/local...');
      }
      return false;
    };

    const fetchFromCsv = async () => {
      try {
        const res = await fetch('/personas.csv');
        if (!res.ok) return false;
        const text = await res.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!json.length) return false;
        setPeople(json.map(normalizeRow));
        setStatusMessage(`Datos cargados desde personas.csv (${json.length})`);
        return true;
      } catch (error) {
        console.error('Error leyendo personas.csv', error);
      }
      return false;
    };

    (async () => {
      const okApi = await fetchFromApi();
      if (!okApi) {
        const okCsv = await fetchFromCsv();
        if (!okCsv) {
          setPeople([]);
          setStatusMessage('No se pudieron cargar datos externos; lista vac�a.');
        }
      }
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick(Math.floor(Date.now() / 30000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && qrBase) {
      localStorage.setItem('qrBase', qrBase);
    }
  }, [qrBase]);

  const centros = useMemo(() => {
    const unique = new Set(people.map((p) => p.centro).filter(Boolean));
    return ['todos', ...Array.from(unique)];
  }, [people]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return people.filter((p) => {
      const nameMatches = `${p.nombres} ${p.apellidos}`.toLowerCase().includes(term);
      const centroMatches = centro === 'todos' || p.centro === centro;
      return nameMatches && centroMatches;
    });
  }, [people, search, centro]);

  const mergeRows = (rows) => {
    setPeople((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const merged = [...prev];
      rows.forEach((row) => {
        if (existingIds.has(row.id)) {
          const index = merged.findIndex((p) => p.id === row.id);
          merged[index] = { ...merged[index], ...row };
        } else {
          merged.push(row);
        }
      });
      return merged;
    });
  };

  const parseSpreadsheet = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const mapped = json.map(normalizeRow);
      mergeRows(mapped);
      setStatusMessage(`Se importaron ${mapped.length} registros desde ${file.name}.`);
    };
    reader.readAsArrayBuffer(file);
  };

  const parsePdf = async (file) => {
    setStatusMessage('Leyendo PDF...');
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker?.default || worker;

    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(' ') + '\n';
    }
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const rows = lines
      .map((line, idx) => {
        const parts = line.split(/[,;\t]/).map((p) => p.trim());
        if (parts.length < 4) return null;
        return normalizeRow(
          {
            documento: parts[0],
            nombres: parts[1],
            apellidos: parts[2],
            centro: parts[3],
            ficha: parts[4] || '',
            rh: parts[5] || '',
          },
          idx,
        );
      })
      .filter(Boolean);

    if (!rows.length) {
      setStatusMessage('No se detectaron filas válidas en el PDF. Asegúrate de que tenga columnas separadas por coma o punto y coma.');
      return;
    }
    mergeRows(rows);
    setStatusMessage(`Se importaron ${rows.length} registros desde PDF.`);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      parseSpreadsheet(file);
    } else if (ext === 'pdf') {
      parsePdf(file).catch(() =>
        setStatusMessage('No se pudo leer el PDF. Usa un Excel/CSV o revisa el formato.'),
      );
    } else {
      setStatusMessage('Formato no soportado. Sube un archivo Excel, CSV o PDF.');
    }
  };

  return (
    <div className="page">
      <Routes>
        <Route
          path="/"
          element={
            <GridView
              filtered={filtered}
              centros={centros}
              search={search}
              setSearch={setSearch}
              centro={centro}
              setCentro={setCentro}
              statusMessage={statusMessage}
              handleUpload={handleUpload}
              qrBase={qrBase}
              setQrBase={setQrBase}
              tick={tick}
              registerRef={registerRef}
              onDownload={onDownload}
            />
          }
        />
        <Route
          path="/persona/:id"
          element={
            <DetailView
              people={people}
              tick={tick}
              qrBase={qrBase}
              registerRef={registerRef}
              onDownload={onDownload}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;

