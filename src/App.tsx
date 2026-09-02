import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, GraduationCap, Calculator, Award, ArrowDown, Heart, Download, CheckCircle2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface SubjectRow {
  id: string;
  name: string;
  credit: string;
  gp: string;
}

export default function App() {
  const [rows, setRows] = useState<SubjectRow[]>(() => {
    try {
      const saved = localStorage.getItem("cgpa-calculator-data");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load from local storage", e);
    }
    return [{ id: crypto.randomUUID(), name: "", credit: "", gp: "" }];
  });

  const [isScrolled, setIsScrolled] = useState(false);
  const performanceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("cgpa-calculator-data", JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), name: "", credit: "", gp: "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof SubjectRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const scrollToPerformance = () => {
    performanceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  let totalCredits = 0;
  let totalPoints = 0;

  rows.forEach((r) => {
    const credit = parseFloat(r.credit);
    const gp = parseFloat(r.gp);
    if (!isNaN(credit) && !isNaN(gp)) {
      totalCredits += credit;
      totalPoints += credit * gp;
    }
  });

  const cgpa = totalCredits === 0 ? "0.00" : (totalPoints / totalCredits).toFixed(2);

  const sortedRows = [...rows]
    .filter(r => !isNaN(parseFloat(r.gp)) && !isNaN(parseFloat(r.credit)))
    .sort((a, b) => parseFloat(b.gp || "0") - parseFloat(a.gp || "0"));

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Indigo 600
    doc.text("Academic Performance Report", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
    
    // Summary Box Background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 36, 182, 24, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 36, 182, 24, 3, 3, 'S');

    // Overall Stats
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(`Total Credits:`, 20, 46);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${totalCredits}`, 20, 54);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Subjects Graded:`, 80, 46);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${sortedRows.length}`, 80, 54);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(147, 51, 234); // Purple 600
    doc.text(`Final CGPA:`, 140, 46);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${cgpa}`, 140, 54);
    
    // Reset Font
    doc.setFont("helvetica", "normal");

    // Table
    const tableData = sortedRows.map((row, index) => {
      const gp = parseFloat(row.gp);
      let label = "Need Improvement";
      if (gp >= 3.75) label = "Excellent";
      else if (gp >= 3.5) label = "Very Good";
      else if (gp >= 3.0) label = "Good";
      else if (gp >= 2.5) label = "Average";
      else label = "Poor";

      return [
        index + 1,
        row.name || `Subject ${index + 1}`,
        row.credit || "0",
        row.gp || "0.00",
        label
      ];
    });

    autoTable(doc, {
      startY: 68,
      head: [["#", "Course / Subject", "Credits", "Grade Point", "Remarks"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 35 }
      }
    });
    
    // Footer Credit
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("Developed by Dhananjoy Chandra Das", 14, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save("Academic_Performance_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 font-sans relative pb-40 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Floating CGPA Circle */}
      <div className={`fixed bottom-12 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out ${isScrolled ? 'scale-90 opacity-100 sm:scale-100' : 'scale-100 opacity-95'}`}>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-200"></div>
          <div className="relative bg-white w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-indigo-50">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 tracking-wider uppercase mb-0.5">CGPA</span>
            <span className="text-xl sm:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {cgpa}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto pt-8 sm:pt-16 px-3 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-2 sm:mb-4 shadow-inner">
            <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">CGPA Calculator</span>
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-lg px-2">
            Track your academic performance effortlessly. Enter your course details below to calculate your CGPA.
          </p>

          {/* App Features / Benefits */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span><b>Live Calculation:</b> See your CGPA update instantly</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span><b>Auto Save:</b> Data remains saved even if you close the tab</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span><b>Smart Analysis:</b> Auto-grades from Excellent to Poor</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span><b>PDF Report:</b> Download a professional marksheet instantly</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Form Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                
                {/* Header Row for both Desktop and Mobile */}
                <div className="grid grid-cols-12 gap-2 sm:gap-4 px-2 pb-2 sm:pb-3 border-b border-slate-100 text-[10px] sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-5">Subject</div>
                  <div className="col-span-3">Credits</div>
                  <div className="col-span-3">GP</div>
                  <div className="col-span-1 text-center"></div>
                </div>

                {/* Input Rows - In a single row even on mobile */}
                <div className="space-y-3 sm:space-y-4">
                  {rows.map((row, index) => (
                    <div 
                      key={row.id} 
                      className="group flex flex-row items-center grid grid-cols-12 gap-2 sm:gap-4 p-2 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-none border border-slate-200 sm:border-none transition-all hover:bg-slate-50 sm:hover:bg-slate-50/80 sm:rounded-xl sm:-mx-2 sm:px-2"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder={window.innerWidth < 640 ? `Sub ${index + 1}` : `Course Name`}
                          value={row.name}
                          onChange={(e) => updateRow(row.id, "name", e.target.value)}
                          className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all outline-none text-xs sm:text-base"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="e.g. 3"
                          value={row.credit}
                          min="0"
                          step="0.5"
                          onChange={(e) => updateRow(row.id, "credit", e.target.value)}
                          className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all outline-none text-xs sm:text-base"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4.0"
                          placeholder="e.g. 4.0"
                          value={row.gp}
                          onChange={(e) => updateRow(row.id, "gp", e.target.value)}
                          className="w-full bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all outline-none font-medium text-xs sm:text-base"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center items-center">
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                            rows.length === 1 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-red-400 hover:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-100'
                          }`}
                          aria-label="Remove subject"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={addRow}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Subject</span>
                  </button>
                  
                  <button
                    onClick={scrollToPerformance}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
                  >
                    <ArrowDown className="w-5 h-5" />
                    <span>View Performance</span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Summary / Performance Sidebar */}
          <div className="lg:col-span-4 space-y-6" ref={performanceRef}>
            
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden sticky top-8">
              
              {/* Analytics Header */}
              <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Analysis</p>
                <div className="flex justify-center gap-8">
                  <div>
                    <p className="text-3xl font-bold text-indigo-600">{totalCredits}</p>
                    <p className="text-xs text-slate-400">Total Credits</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-purple-600">{sortedRows.length}</p>
                    <p className="text-xs text-slate-400">Subjects Graded</p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Performance Board</h3>
                  </div>
                  
                  {sortedRows.length > 0 && (
                    <button 
                      onClick={downloadPDF}
                      title="Download PDF Report"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {sortedRows.length > 0 ? (
                  <ul className="space-y-4">
                    {sortedRows.map((s, index) => {
                      const gp = parseFloat(s.gp);
                      let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
                      let badgeClass = "bg-slate-200 text-slate-700";
                      let label = "Need Improvement";
                      
                      if (gp >= 3.75) {
                        colorClass = "bg-emerald-50 border-emerald-200";
                        badgeClass = "bg-emerald-100 text-emerald-700";
                        label = "Excellent";
                      } else if (gp >= 3.5) {
                        colorClass = "bg-teal-50 border-teal-200";
                        badgeClass = "bg-teal-100 text-teal-700";
                        label = "Very Good";
                      } else if (gp >= 3.0) {
                        colorClass = "bg-indigo-50 border-indigo-200";
                        badgeClass = "bg-indigo-100 text-indigo-700";
                        label = "Good";
                      } else if (gp >= 2.5) {
                        colorClass = "bg-amber-50 border-amber-200";
                        badgeClass = "bg-amber-100 text-amber-700";
                        label = "Average";
                      } else {
                        colorClass = "bg-red-50 border-red-200";
                        badgeClass = "bg-red-100 text-red-700";
                        label = "Poor";
                      }

                      return (
                        <li
                          key={s.id}
                          className={`p-4 rounded-2xl border transition-all flex justify-between items-center ${colorClass}`}
                        >
                          <div className="overflow-hidden pr-3">
                            <p className="font-semibold text-slate-800 truncate text-sm sm:text-base">
                              {s.name || `Subject ${index + 1}`}
                            </p>
                            <p className="text-[10px] sm:text-xs font-semibold opacity-70 mt-1 uppercase tracking-wide">
                              {label} • {s.credit ? `${s.credit} Cr` : '0 Cr'}
                            </p>
                          </div>
                          <div className={`px-3 py-2 rounded-xl font-bold text-sm sm:text-base shadow-sm ${badgeClass}`}>
                            {s.gp}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <Calculator className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Enter course details with credits and grade points to see your performance board.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Footer / Credit Section */}
      <div className="absolute bottom-4 w-full text-center pointer-events-none">
        <p className="text-sm text-slate-500 font-medium flex items-center justify-center gap-1.5 pointer-events-auto">
          Developed with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by <span className="font-bold text-indigo-600">Dhananjoy Chandra Das</span>
        </p>
      </div>
    </div>
  );
}
