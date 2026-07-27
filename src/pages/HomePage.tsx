import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';
import { 
  Globe, BookOpen, GraduationCap, Users, Calendar, Mail, Search, Sparkles, 
  ChevronRight, ArrowRight, MapPin, Phone, Award, Shield, CheckCircle, 
  ExternalLink, FileText, Bookmark, Info, HelpCircle
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Public Portal Navigation States
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'academics' | 'admissions' | 'research' | 'news' | 'events' | 'contact'>('home');

  // Dynamic Data States
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [researchProjects, setResearchProjects] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [cmsPages, setCmsPages] = useState<any[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ pages: any[], news: any[], events: any[] }>({ pages: [], news: [], events: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: 'Admissions Inquiry', message: '' });
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const [eventRegistered, setEventRegistered] = useState<number | null>(null);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    // 1. Fetch departments
    try {
      const deptRes = await fetch('/api/departments');
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        if (deptData.status === 'success') setDepartments(deptData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching departments:', err);
    }

    // 2. Fetch programs
    try {
      const progRes = await fetch('/api/programs');
      if (progRes.ok) {
        const progData = await progRes.json();
        if (progData.status === 'success') setPrograms(progData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching programs:', err);
    }

    // 3. Fetch teachers for Faculty Directory
    try {
      const teachRes = await fetch('/api/teachers');
      if (teachRes.ok) {
        const teachData = await teachRes.json();
        if (teachData.status === 'success') setTeachers(teachData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching teachers:', err);
    }

    // 4. Fetch news
    try {
      const newsRes = await fetch('/api/news');
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.status === 'success') setNews(newsData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching news:', err);
    }

    // 5. Fetch events
    try {
      const evtRes = await fetch('/api/events');
      if (evtRes.ok) {
        const evtData = await evtRes.json();
        if (evtData.status === 'success') setEvents(evtData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching events:', err);
    }

    // 6. Fetch custom CMS pages
    try {
      const cmsRes = await fetch('/api/cms/pages');
      if (cmsRes.ok) {
        const cmsData = await cmsRes.json();
        if (cmsData.status === 'success') setCmsPages(cmsData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching custom CMS pages:', err);
    }

    // 7. Fetch research projects if endpoint is available
    try {
      const resRes = await fetch('/api/research/projects');
      if (resRes.ok) {
        const resData = await resRes.json();
        if (resData.status === 'success') setResearchProjects(resData.data || []);
      }
    } catch (err) {
      console.warn('Error fetching research projects:', err);
    }
  };

  // Contact submit handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(`Thank you, ${contactForm.name}! Your message regarding "${contactForm.subject}" has been logged successfully. Our admissions office will get back to you shortly.`);
    setContactForm({ name: '', email: '', subject: 'Admissions Inquiry', message: '' });
    setTimeout(() => setSubmittedMessage(null), 8000);
  };

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Filter clientside or invoke server api with search term query
      const pFiltered = cmsPages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const nFiltered = news.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));
      const eFiltered = events.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || ev.description.toLowerCase().includes(searchQuery.toLowerCase()));

      setSearchResults({ pages: pFiltered, news: nFiltered, events: eFiltered });
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegisterEvent = (eventId: number) => {
    setEventRegistered(eventId);
    setTimeout(() => setEventRegistered(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 border-b border-slate-800 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold text-white tracking-wider uppercase">Smart International University</h1>
              <p className="text-[10px] text-slate-400">Outcome & Compliance Driven Academic Portal</p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-1 text-xs">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'academics', label: 'Academics' },
              { id: 'admissions', label: 'Admissions' },
              { id: 'research', label: 'Research' },
              { id: 'news', label: 'News' },
              { id: 'events', label: 'Events' },
              { id: 'contact', label: 'Contact Us' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchQuery(''); }}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" className="text-xs">
              <span>Sign In Portal</span>
              <ArrowRight className="h-3 w-3 ml-1 inline" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Global Search Bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-3">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dynamic programs, CMS web pages, scheduled events, and live news articles..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <Button variant="secondary" type="submit" className="text-xs">
              <span>Search Portal</span>
            </Button>
          </form>

          {searchQuery && (
            <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-slate-800 text-left space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Results matching "{searchQuery}"</h3>
              
              {searchResults.pages.length === 0 && searchResults.news.length === 0 && searchResults.events.length === 0 ? (
                <p className="text-xs text-slate-500">No outcomes found matching your query.</p>
              ) : (
                <div className="space-y-4">
                  {searchResults.pages.map((p) => (
                    <div key={p.id} className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 font-bold px-1.5 py-0.5 rounded">CMS Page</span>
                      <h4 className="text-xs font-bold text-white mt-1">{p.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{p.content}</p>
                    </div>
                  ))}

                  {searchResults.news.map((n) => (
                    <div key={n.id} className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                      <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded">News Article</span>
                      <h4 className="text-xs font-bold text-white mt-1">{n.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.summary || n.content}</p>
                    </div>
                  ))}

                  {searchResults.events.map((e) => (
                    <div key={e.id} className="p-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
                      <span className="text-[9px] bg-amber-950 text-amber-300 font-bold px-1.5 py-0.5 rounded">Scheduled Event</span>
                      <h4 className="text-xs font-bold text-white mt-1">{e.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{e.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* ----------------- VIEW: HOME ----------------- */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            {/* Elegant Hero Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-slate-800 p-8 md:p-12 text-left">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Globe className="h-48 w-48 text-indigo-400" />
              </div>
              <div className="max-w-2xl relative z-10 space-y-4">
                <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-xs font-bold text-indigo-400">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Ranked Top #50 Globally for Educational Integrity</span>
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                  Where Outstanding Outcome Assessments Build Global Careers
                </h2>
                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  Join a community of trailblazing researchers, outcomes compliant scholars, and high-performance engineering faculties. Smart International University merges rigid validation with digital integration.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button variant="primary" onClick={() => setActiveTab('admissions')}>
                    Explore Admissions
                  </Button>
                  <Button variant="secondary" onClick={() => setActiveTab('academics')}>
                    View Program Catalog
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick stats banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-800 text-center">
              <div>
                <div className="text-3xl font-extrabold text-white">40+</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Undergrad Programs</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">100%</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">OBE Compliant Syllabi</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">18:1</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Student-to-Faculty Ratio</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">98%</div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Post-Grad Placement Rate</div>
              </div>
            </div>

            {/* Live Slider: Featured Campus News & Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">Featured Campus News</h3>
                  <button onClick={() => setActiveTab('news')} className="text-xs text-indigo-400 hover:underline flex items-center">
                    <span>All News</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {news.filter(n => n.published).slice(0, 2).map((item) => (
                  <div key={item.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition">
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase">{item.category}</span>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{item.summary}</p>
                    <div className="text-[10px] text-slate-500 pt-1">{new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">Scheduled Expos & Events</h3>
                  <button onClick={() => setActiveTab('events')} className="text-xs text-indigo-400 hover:underline flex items-center">
                    <span>All Events</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {events.filter(e => e.published).slice(0, 2).map((evt) => (
                  <div key={evt.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-rose-400" />
                        <span>{evt.location}</span>
                      </span>
                      <span className="text-[10px] text-indigo-400 font-bold">{new Date(evt.startDate).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{evt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW: ABOUT ----------------- */}
        {activeTab === 'about' && (
          <div className="space-y-8 text-left max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-white">About Smart International University</h2>
            
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wide">Vision & Mission</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Our Vision:</strong> To be recognized as a leading global university for excellence in education, compliance-based learning mapping, quantum technologies, and ethical governance, graduating highly competent personnel suited for international challenges.
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Our Mission:</strong> To provide rigorous, outcomes-assessed academic degrees; expand global collaboration indexes; foster critical research programs; and align institutional workflows to top-tier accreditation frameworks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Core Academic Governance</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compliance and Outcome-Based Education (OBE) drive our university. Every single syllabus is continuously mapped to Program Learning Outcomes (PLOs) and Course Learning Outcomes (CLOs) to ensure compliance.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">University Leadership Statement</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "At SIU, we believe that education is an accountability. Our state-of-the-art enterprise tools ensure absolute transparency, from dynamic grading books to live verifiable degree audits." — Chancellor's Message.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- VIEW: ACADEMICS ----------------- */}
        {activeTab === 'academics' && (
          <div className="space-y-8 text-left">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black text-white mb-2">Academics & Department Profiles</h2>
              <p className="text-xs text-slate-400">
                Explore our dynamic campus structure consisting of distinct departments and degree programs, all backed by real outcome mapping.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <div key={dept.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded uppercase">
                      Code: {dept.code || 'ENG'}
                    </span>
                    <BookOpen className="h-4 w-4 text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{dept.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-3 mb-4">{dept.description || 'Dedicated to nurturing global experts in respective industry modules.'}</p>
                  
                  <div className="border-t border-slate-800 pt-3">
                    <span className="text-[10px] text-slate-500 block mb-2 font-semibold uppercase">Degree Programs Offered:</span>
                    <div className="space-y-1.5">
                      {programs.filter(p => p.departmentId === dept.id).map(p => (
                        <div key={p.id} className="text-xs text-slate-300 flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{p.durationYears} Years</span>
                        </div>
                      ))}
                      {programs.filter(p => p.departmentId === dept.id).length === 0 && (
                        <span className="text-xs text-slate-500 italic">BS Engineering Science, MS Data Sciences</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ----------------- VIEW: ADMISSIONS ----------------- */}
        {activeTab === 'admissions' && (
          <div className="space-y-8 text-left">
            <h2 className="text-2xl font-black text-white">Admissions & Scholarships</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <Award className="h-5 w-5 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Scholarship Schemes</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  SIU offers outstanding merit-based scholarships matching up to 100% of tuition costs for high-achieving international applicants.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Admission Requirements</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Submit academic transcripts, standard scores (SAT/IELTS), and dynamic research portfolios directly on our digital admissions desk.
                </p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                <Shield className="h-5 w-5 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Verifiable Compliance</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Our transparent fee structure is fully aligned with regional regulatory ministries, eliminating hidden administrative surcharges.
                </p>
              </div>
            </div>

            {/* Quick Apply Form */}
            <Card title="Quick Admissions Inquiry Form" description="Submit your details directly to connect with our campus admissions team.">
              {submittedMessage ? (
                <div className="p-4 bg-emerald-950 text-emerald-200 border border-emerald-800 rounded-lg text-xs font-semibold">
                  {submittedMessage}
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. John Smith"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="e.g. john@domain.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Inquiry Message</label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Tell us about the courses or dynamic programs you are looking to enroll into..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button variant="primary" type="submit">Submit Inquiry</Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        )}

        {/* ----------------- VIEW: RESEARCH ----------------- */}
        {activeTab === 'research' && (
          <div className="space-y-8 text-left">
            <h2 className="text-2xl font-black text-white">Quantum & Outcome-Based Research Portal</h2>
            <p className="text-xs text-slate-400">
              Explore dynamic university research milestones, Principal Investigator mappings, and scholarly publications registered within our institutional framework.
            </p>

            {researchProjects.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ongoing Research Programs</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <h5 className="text-xs font-bold text-white">AI-Driven Educational Compliance Engine</h5>
                    <p className="text-[11px] text-slate-400 mt-1">Autonomous mapping of learning milestones using LLMs and outcome metrics database.</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <h5 className="text-xs font-bold text-white">Quantum Cryptographic Outcome Validation</h5>
                    <p className="text-[11px] text-slate-400 mt-1">A blockchain-inspired tamper-proof academic audit ledger for international universities.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {researchProjects.map((proj) => (
                  <div key={proj.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <h4 className="text-xs font-bold text-white">{proj.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{proj.abstract}</p>
                    <div className="text-[10px] text-indigo-400 mt-2 font-mono">Area: {proj.researchArea}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- VIEW: NEWS ----------------- */}
        {activeTab === 'news' && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-black text-white">SIU News & Press Releases</h2>

            {news.filter(n => n.published).length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500 text-xs">
                No articles are currently live. Check back later for campus news.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.filter(n => n.published).map((article) => (
                  <div key={article.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="aspect-video bg-slate-950 rounded-lg mb-3 overflow-hidden border border-slate-800">
                        {article.featuredImage ? (
                          <img src={article.featuredImage} alt={article.title} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-600 bg-slate-950 text-[10px]">
                            Smart University News Image
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase">{article.category}</span>
                      <h4 className="text-sm font-bold text-white mt-1">{article.title}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-3">{article.summary}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-4 pt-2 border-t border-slate-800 flex justify-between">
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-indigo-400">Read &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- VIEW: EVENTS ----------------- */}
        {activeTab === 'events' && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-black text-white">Upcoming Campus Events Calendar</h2>

            {events.filter(e => e.published).length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-500 text-xs">
                No campus events scheduled. Check back later.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.filter(e => e.published).map((evt) => (
                  <div key={evt.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-400" />
                        <span>{evt.location}</span>
                      </span>
                      <span className="font-mono text-indigo-400">{new Date(evt.startDate).toLocaleString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{evt.description}</p>
                    
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-semibold uppercase">Organized by: {evt.organizer}</span>
                      {eventRegistered === evt.id ? (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Registration Complied!</span>
                        </span>
                      ) : (
                        <Button variant="primary" className="text-[11px] py-1 px-3" onClick={() => handleRegisterEvent(evt.id)}>
                          Register Seat
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- VIEW: CONTACT ----------------- */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-2xl font-black text-white">Contact Us</h2>
              <p className="text-xs text-slate-400">
                Reach out to our centralized administrative services or locate regional campus coordinates.
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-rose-400" />
                  <span>100 Innovation Avenue, Sector 4, Silicon Oasis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-indigo-400" />
                  <span>+1 (800) 555-8901 / admin@siu.edu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-400" />
                  <span>Complaints Desk: compliance@siu.edu</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <Card title="Send General Inquiry" description="Your query will be routed directly to the appropriate directorate via automated queue.">
                {submittedMessage ? (
                  <div className="p-4 bg-emerald-950 text-emerald-200 border border-emerald-800 rounded-lg text-xs font-semibold">
                    {submittedMessage}
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      >
                        {['Admissions Inquiry', 'Research Cooperation', 'Accreditation Query', 'Other'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Detailed Message</label>
                      <textarea
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="primary" type="submit">Send Message</Button>
                    </div>
                  </form>
                )}
              </Card>
            </div>
          </div>
        )}

      </main>

      {/* Dynamic Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-left text-xs text-slate-400">
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Compliance & OBE Directorate</h4>
            <p className="leading-relaxed">
              All degrees, outcomes, syllabi mapping parameters, and verifiable degree audits conform to regional quality indicators.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">Quick Navigation</h4>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setActiveTab('home')} className="hover:text-white hover:underline text-left">Homepage</button>
              <button onClick={() => setActiveTab('about')} className="hover:text-white hover:underline text-left">About Campus</button>
              <button onClick={() => setActiveTab('academics')} className="hover:text-white hover:underline text-left">Syllabus Catalog</button>
              <button onClick={() => setActiveTab('admissions')} className="hover:text-white hover:underline text-left font-semibold text-indigo-400">Apply Desk</button>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white text-sm mb-3">System Framework</h4>
            <p className="leading-relaxed">
              Verifiable outcomes validation network powered by robust secure JWT & Firebase auth frameworks.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
