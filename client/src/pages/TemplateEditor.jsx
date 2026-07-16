import { useState, useEffect } from 'react';
import api from '../api';
import { Save } from 'lucide-react';

export default function TemplateEditor() {
  const [config, setConfig] = useState({
    name: 'Standard ECI 3x10',
    columns: 3, rows: 10,
    marginLeft: 60, marginTop: 250,
    cardWidth: 780, cardHeight: 300,
    spacingX: 10, spacingY: 10,
    photoBox: { xOffsetPercent: 70, yOffsetPercent: 15, widthPercent: 28, heightPercent: 80 },
    isDefault: true
  });
  
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch default
    api.get('/templates').then(res => {
      if (res.data.length > 0) {
        const defaultTpl = res.data.find(t => t.isDefault) || res.data[0];
        setConfig(defaultTpl);
      }
    }).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value);
    
    if (name.startsWith('photoBox.')) {
      const field = name.split('.')[1];
      setConfig(prev => ({ ...prev, photoBox: { ...prev.photoBox, [field]: val } }));
    } else {
      setConfig(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.post('/templates', config);
      setConfig(res.data);
      setMessage('Template saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Error saving template.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Grid Template Editor</h1>
          <p className="text-slate-500 mt-1">Define precise cropping coordinates for Electoral Rolls.</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center">
          <Save className="w-4 h-4 mr-2" /> Save Template
        </button>
      </div>

      {message && <div className="mb-4 p-3 bg-indigo-50 text-indigo-700 rounded-lg">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Basic Info</h3>
            <label className="block text-sm mb-1 text-slate-600">Template Name</label>
            <input type="text" name="name" value={config.name} onChange={handleChange} className="input-field mb-4" />
            <label className="flex items-center text-sm text-slate-600">
              <input type="checkbox" name="isDefault" checked={config.isDefault} onChange={handleChange} className="mr-2" />
              Set as Default
            </label>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Grid Structure</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-slate-600">Columns</label>
                <input type="number" name="columns" value={config.columns} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Rows</label>
                <input type="number" name="rows" value={config.rows} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Card Width</label>
                <input type="number" name="cardWidth" value={config.cardWidth} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Card Height</label>
                <input type="number" name="cardHeight" value={config.cardHeight} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Offsets & Margins</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-slate-600">Left Margin</label>
                <input type="number" name="marginLeft" value={config.marginLeft} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Top Margin</label>
                <input type="number" name="marginTop" value={config.marginTop} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Spacing X</label>
                <input type="number" name="spacingX" value={config.spacingX} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Spacing Y</label>
                <input type="number" name="spacingY" value={config.spacingY} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6">
            <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-white">Photo Crop Box (Relative %)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1 text-slate-600">X Offset %</label>
                <input type="number" name="photoBox.xOffsetPercent" value={config.photoBox.xOffsetPercent} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Y Offset %</label>
                <input type="number" name="photoBox.yOffsetPercent" value={config.photoBox.yOffsetPercent} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Width %</label>
                <input type="number" name="photoBox.widthPercent" value={config.photoBox.widthPercent} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm mb-1 text-slate-600">Height %</label>
                <input type="number" name="photoBox.heightPercent" value={config.photoBox.heightPercent} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Visualizer */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 h-[800px] overflow-auto bg-slate-100 dark:bg-slate-800">
            {/* We draw a simulated grid based on parameters */}
            <h3 className="font-medium text-slate-500 mb-4 text-center">Interactive Grid Preview (Scale 1:3 for visualization)</h3>
            <div 
              className="relative bg-white shadow-sm border border-slate-300 mx-auto" 
              style={{ width: '826px', height: '1169px' }} // Standard A4 at scale
            >
               {/* Generate boxes */}
               {Array.from({ length: config.rows }).map((_, r) => 
                 Array.from({ length: config.columns }).map((_, c) => {
                   const scale = 0.33; // 1:3 scale
                   const left = (config.marginLeft + (c * (config.cardWidth + config.spacingX))) * scale;
                   const top = (config.marginTop + (r * (config.cardHeight + config.spacingY))) * scale;
                   const width = config.cardWidth * scale;
                   const height = config.cardHeight * scale;
                   
                   return (
                     <div 
                       key={`${r}-${c}`} 
                       className="absolute border-2 border-indigo-500 bg-indigo-500/10"
                       style={{ left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }}
                     >
                       {/* Photo Box */}
                       <div 
                         className="absolute border-2 border-emerald-500 bg-emerald-500/20"
                         style={{ 
                           left: `${config.photoBox.xOffsetPercent}%`, 
                           top: `${config.photoBox.yOffsetPercent}%`,
                           width: `${config.photoBox.widthPercent}%`,
                           height: `${config.photoBox.heightPercent}%`
                         }}
                       ></div>
                     </div>
                   );
                 })
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
