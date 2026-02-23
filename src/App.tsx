import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import JsBarcode from 'jsbarcode';
import { FileText, Settings, Grid, Download, RefreshCw, Type, Layout } from 'lucide-react';

const BarcodeItem: React.FC<{ value: string, widthCm?: number, heightCm?: number, isPreview?: boolean }> = ({ value, widthCm, heightCm, isPreview = false }) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && value) {
      try {
        JsBarcode(imgRef.current, value, {
          format: 'CODE128',
          displayValue: true,
          margin: 10,
          width: 2,
          height: 40,
          fontSize: 16,
          lineColor: '#000',
        });
      } catch (e) {
        // Ignore invalid barcodes
      }
    }
  }, [value]);

  const containerStyle = isPreview 
    ? { width: '100%', height: '100%', padding: '2px' }
    : { width: `${widthCm}cm`, height: `${heightCm}cm`, padding: '2mm', boxSizing: 'border-box' as const, backgroundColor: '#ffffff' };

  return (
    <div 
      style={{ 
        ...containerStyle,
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        overflow: 'hidden',
      }}
      className={isPreview ? "border border-dashed border-neutral-200" : ""}
    >
      {value ? (
        <img ref={imgRef} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', backgroundColor: '#ffffff' }} alt={value} />
      ) : (
        <span style={{ color: '#d1d5db', fontSize: '10px' }}>Vazio</span>
      )}
    </div>
  );
};

export default function App() {
  const [title, setTitle] = useState("Minhas Etiquetas");
  const [width, setWidth] = useState<number>(4);
  const [height, setHeight] = useState<number>(2.5);
  
  const [grid, setGrid] = useState({ cols: 0, rows: 0, total: 0 });
  const [calculated, setCalculated] = useState(false);
  
  const [mode, setMode] = useState<"identical" | "individual">("identical");
  const [identicalCode, setIdenticalCode] = useState("123456789");
  const [individualCodes, setIndividualCodes] = useState<string[]>([]);
  const [genMethod, setGenMethod] = useState<"manual" | "random">("manual");

  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const calculateSpace = () => {
    // A4 Dimensions in cm
    const a4Width = 21;
    const a4Height = 29.7;
    const margin = 1; // 1cm margin all around
    const titleHeight = 1.5; // 1.5cm for title
    
    const usableWidth = a4Width - (margin * 2);
    const usableHeight = a4Height - (margin * 2) - titleHeight;
    
    const cols = Math.floor(usableWidth / width);
    const rows = Math.floor(usableHeight / height);
    const total = cols * rows;
    
    setGrid({ cols, rows, total });
    
    // Preserve existing codes if possible
    const newCodes = Array(total).fill("");
    for (let i = 0; i < Math.min(total, individualCodes.length); i++) {
      newCodes[i] = individualCodes[i];
    }
    setIndividualCodes(newCodes);
    setCalculated(true);
  };

  const generateRandomCodes = () => {
    const newCodes = Array(grid.total).fill("").map(() => {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    });
    setIndividualCodes(newCodes);
  };

  const handleIndividualCodeChange = (index: number, value: string) => {
    const newCodes = [...individualCodes];
    newCodes[index] = value;
    setIndividualCodes(newCodes);
  };

  const downloadPDF = async () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    
    try {
      // html2canvas needs the element to be visible, but we can position it off-screen
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Reduced from 3 to 2 to prevent memory issues on some devices
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title || 'etiquetas'}.pdf`);
    } catch (error: any) {
      console.error("Error generating PDF", error);
      alert(`Erro ao gerar o PDF: ${error?.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans text-neutral-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-3">
            <Grid className="w-8 h-8 text-indigo-600" />
            Gerador de Folha de Códigos de Barras
          </h1>
          <p className="text-neutral-500 mt-2">Crie e exporte folhas A4 com etiquetas de código de barras prontas para impressão.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1 & 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-neutral-400" />
                Configuração da Folha
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Título da Folha</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Ex: Produtos Lote A"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Largura do Código (cm)</label>
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => setWidth(Number(e.target.value))}
                      min="2" step="0.5"
                      className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Altura do Código (cm)</label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      min="1" step="0.5"
                      className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={calculateSpace}
                  className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Layout className="w-5 h-5" />
                  Calcular Espaço
                </button>
              </div>
            </div>

            {/* Step 3, 4 & 5 (Conditional) */}
            {calculated && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="text-indigo-800 font-medium text-center">
                    Cabem <strong className="text-xl">{grid.total}</strong> etiquetas por página
                  </p>
                  <p className="text-indigo-600 text-sm text-center mt-1">
                    ({grid.cols} colunas × {grid.rows} linhas)
                  </p>
                </div>

                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Type className="w-5 h-5 text-neutral-400" />
                  Conteúdo dos Códigos
                </h2>

                <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
                  <button
                    onClick={() => setMode('identical')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'identical' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Conteúdo Idêntico
                  </button>
                  <button
                    onClick={() => setMode('individual')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'individual' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Conteúdo Individual
                  </button>
                </div>

                {mode === 'identical' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Código para todas as etiquetas</label>
                      <input 
                        type="text" 
                        value={identicalCode}
                        onChange={(e) => setIdenticalCode(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="Ex: 789123456"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setGenMethod('manual')}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl border transition-all ${genMethod === 'manual' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'}`}
                      >
                        Gerar Manualmente
                      </button>
                      <button
                        onClick={() => {
                          setGenMethod('random');
                          generateRandomCodes();
                        }}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl border transition-all flex items-center justify-center gap-2 ${genMethod === 'random' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'}`}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Gerar com IA/Aleatório
                      </button>
                    </div>

                    {genMethod === 'manual' && (
                      <div className="max-h-60 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {individualCodes.map((code, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-xs font-mono text-neutral-400 w-6 text-right">{idx + 1}.</span>
                            <input 
                              type="text" 
                              value={code}
                              onChange={(e) => handleIndividualCodeChange(idx, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                              placeholder={`Código ${idx + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {genMethod === 'random' && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm text-center">
                        {grid.total} códigos aleatórios únicos foram gerados e aplicados à grade.
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-neutral-100">
                  <button 
                    onClick={downloadPDF}
                    disabled={isGenerating || grid.total === 0}
                    className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {isGenerating ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 h-full flex flex-col min-h-[600px]">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-neutral-400" />
                Pré-visualização (A4)
              </h2>
              
              <div className="flex-1 bg-neutral-100 rounded-xl overflow-hidden flex items-center justify-center p-4">
                {calculated ? (
                  <div 
                    className="bg-white shadow-md transition-all duration-500 ease-in-out origin-top"
                    style={{
                      // Aspect ratio of A4 (210/297 = 0.707)
                      aspectRatio: '210 / 297',
                      width: '100%',
                      maxWidth: '400px',
                      padding: '4%', // Relative padding to simulate 1cm margin
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <h3 className="text-center font-bold text-neutral-800 mb-4 truncate" style={{ fontSize: 'clamp(10px, 2vw, 16px)' }}>
                      {title || 'Sem Título'}
                    </h3>
                    
                    <div 
                      className="flex-1 grid gap-[1px]"
                      style={{
                        gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
                      }}
                    >
                      {Array(grid.total).fill(0).map((_, idx) => {
                        const codeValue = mode === 'identical' ? identicalCode : individualCodes[idx];
                        return (
                          <BarcodeItem 
                            key={idx} 
                            value={codeValue} 
                            isPreview={true}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 flex flex-col items-center">
                    <Layout className="w-12 h-12 mb-3 opacity-20" />
                    <p>Configure as dimensões e clique em<br/>"Calcular Espaço" para ver a prévia.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden A4 Container for PDF Generation */}
      {calculated && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div 
            ref={printRef} 
            style={{ 
              width: '210mm', 
              height: '297mm', 
              backgroundColor: '#ffffff', 
              padding: '10mm', 
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h1 style={{ height: '15mm', textAlign: 'center', fontSize: '18pt', fontWeight: 'bold', color: '#000000', margin: 0, paddingBottom: '5mm', boxSizing: 'border-box' }}>
              {title}
            </h1>
            
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${grid.cols}, ${width}cm)`,
                gridTemplateRows: `repeat(${grid.rows}, ${height}cm)`,
                justifyContent: 'center',
                alignContent: 'start',
                gap: '0',
                backgroundColor: '#ffffff',
              }}
            >
              {Array(grid.total).fill(0).map((_, idx) => {
                const codeValue = mode === 'identical' ? identicalCode : individualCodes[idx];
                return (
                  <BarcodeItem 
                    key={idx} 
                    value={codeValue} 
                    widthCm={width} 
                    heightCm={height} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
