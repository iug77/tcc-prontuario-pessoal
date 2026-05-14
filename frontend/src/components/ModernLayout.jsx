import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Header = ({ usuario, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-dark-200 shadow-sm">
      <div className="container-main flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
            📋
          </div>
          <h2 className="text-xl font-bold text-dark-900">ProSaúde</h2>
        </div>

        {/* Nav Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <a href="/dashboard" className="nav-item">Dashboard</a>
          <a href="/meus-registros" className="nav-item">Meus Registros</a>
          <a href="/chat" className="nav-item">💬 Chat</a>
          <a href="/permissoes" className="nav-item">🔐 Permissões</a>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-dark-900">{usuario?.nome}</p>
            <p className="text-xs text-dark-500">{usuario?.tipo}</p>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold hover:bg-primary-200 transition-colors"
          >
            {usuario?.nome?.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-16 right-4 bg-white rounded-xl shadow-lg border border-dark-200 overflow-hidden w-max">
              <a href="/auditoria" className="block px-4 py-2 hover:bg-primary-50 text-dark-700">
                🔍 Auditoria
              </a>
              {usuario?.tipo === 'profissional' && (
                <a href="/dashboard-profissional" className="block px-4 py-2 hover:bg-primary-50 text-dark-700">
                  👨‍⚕️ Dashboard Prof
                </a>
              )}
              <button 
                onClick={onLogout}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-semibold"
              >
                🚪 Sair
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden">
          <span className="text-2xl">☰</span>
        </button>

      </div>
    </header>
  );
};

export const Sidebar = ({ menuItems, isOpen }) => {
  const navigate = useNavigate();

  const menuIcons = {
    dashboard: '📊',
    registros: '📋',
    chat: '💬',
    permissoes: '🔐',
    auditoria: '🔍',
    insights: '🤖',
    profissional: '👨‍⚕️',
  };

  return (
    <aside className={`sidebar fixed md:sticky ${isOpen ? 'left-0' : '-left-full'} md:left-0`}>
      <nav className="space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className="nav-item w-full text-left flex items-center gap-3 px-4 py-3"
          >
            <span className="text-xl">{menuIcons[item.id]}</span>
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export const Container = ({ children, maxWidth = '7xl', className = '' }) => {
  return (
    <div className={`max-w-${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};

export const PageHeader = ({ title, subtitle, action, icon }) => {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex items-center gap-4">
        {icon && <span className="text-4xl">{icon}</span>}
        <div>
          <h1 className="text-4xl font-bold">{title}</h1>
          {subtitle && <p className="text-dark-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const EmptyState = ({ icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-dark-600 mb-6 max-w-md">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex items-center justify-center py-8">
      <div className={`${sizes[size]} loader`} />
    </div>
  );
};

export const Modal = ({ isOpen, title, children, onClose, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-200">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-2xl text-dark-400 hover:text-dark-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="mb-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-3 pt-4 border-t border-dark-200">
            {footer}
          </div>
        )}

      </div>
    </div>
  );
};

export const Tabs = ({ tabs, defaultTab = 0, onChange }) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const handleTabChange = (index) => {
    setActiveTab(index);
    onChange?.(index);
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-dark-200">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => handleTabChange(i)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === i
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-dark-600 hover:text-dark-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="mt-6">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export const Pagination = ({ currentPage = 1, totalPages = 5, onPageChange }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-secondary btn-small"
      >
        ← Anterior
      </button>

      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg font-semibold transition-all ${
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'bg-white text-dark-600 border border-dark-300 hover:border-primary-600'
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-secondary btn-small"
      >
        Próxima →
      </button>
    </div>
  );
};
