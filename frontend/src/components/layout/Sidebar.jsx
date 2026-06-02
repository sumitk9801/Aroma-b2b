import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NAV_ITEMS } from '../../utils/constants';
import { selectIsAdmin, selectUser } from '../../store/slices/authSlice';
import { selectSidebarCollapsed, toggleSidebar, selectMobileMenuOpen, setMobileMenuOpen } from '../../store/slices/uiSlice';
import { cn } from '../../utils/cn';

export default function Sidebar() {
  const dispatch = useDispatch();
  const isAdmin = useSelector(selectIsAdmin);
  const user = useSelector(selectUser);
  const collapsed = useSelector(selectSidebarCollapsed);
  const mobileMenuOpen = useSelector(selectMobileMenuOpen);
  const location = useLocation();
  const [openMenus, setOpenMenus] = useState({ Inventory: true });
  const [isMobile, setIsMobile] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const listener = () => setIsMobile(media.matches);
    listener();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const toggleMenu = (label) => {
    if (collapsed && !isMobile) return;
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const filteredNav = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const isActive = (path) => location.pathname === path;
  const isParentActive = (item) =>
    item.children?.some((child) => location.pathname.startsWith(child.path));

  return (
    <motion.aside
      initial={false}
      animate={{ width: isMobile ? 256 : (collapsed ? 64 : 256) }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col h-screen bg-navyDeep overflow-hidden flex-shrink-0",
        "lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out",
        isMobile && (mobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full")
      )}
      style={{ minWidth: isMobile ? 0 : (collapsed ? 64 : 256) }}
    >
      {/* Logo */}
      <div 
        className="flex items-center gap-2 px-4 py-2 border-b border-white/10"
        onMouseEnter={() => setIsLogoHovered(true)}
        onMouseLeave={() => setIsLogoHovered(false)}
      >
        <div className="w-12 h-12 overflow-hidden flex items-center justify-center flex-shrink-0 bg-transparent relative">
          {collapsed && isLogoHovered ? (
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="w-8 h-8 bg-white border border-border shadow-md rounded-full flex items-center justify-center text-navyDeep hover:bg-neon hover:border-neon hover:text-navyDeep transition-all duration-200"
              title="Expand Sidebar"
            >
              <PanelLeftOpen size={15} />
            </button>
          ) : (
            <img src="/favicon.png" alt="Aroma B2B" className="w-full h-full object-contain scale-[3] mt-2" />
          )}
        </div>
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <span className="font-display font-bold text-white text-lg tracking-tight">
                Aroma <span className="text-neon">B2B</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className={cn(
          "absolute top-5 -right-0.5 z-10 w-8 h-8 bg-white border border-border shadow-md rounded-full flex items-center justify-center text-navyDeep hover:bg-neon hover:border-neon hover:text-navyDeep transition-all duration-200",
          collapsed ? "hidden" : "hidden lg:flex"
        )}
      >
        <PanelLeftClose size={15} />
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1 scrollbar-thin">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children?.length > 0;
          const parentActive = hasChildren && isParentActive(item);
          const menuOpen = openMenus[item.label];

          if (hasChildren) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm',
                    parentActive
                      ? 'bg-navy text-white'
                      : 'text-grayLight hover:bg-navy/40 hover:text-white'
                  )}
                >
                  {parentActive && !collapsed && (
                    <div className="absolute left-3 w-1 h-6 bg-neon rounded-full" />
                  )}
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 text-left font-medium"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      animate={{ rotate: menuOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={14} />
                    </motion.div>
                  )}
                </button>

                <AnimatePresence>
                  {menuOpen && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-4 mt-1 space-y-1"
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isActive(child.path);
                        return (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => isMobile && dispatch(setMobileMenuOpen(false))}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors relative',
                              active
                                ? 'bg-navy text-white'
                                : 'text-grayLight hover:bg-navy/40 hover:text-white'
                            )}
                          >
                            {active && (
                              <div className="absolute left-0 w-1 h-5 bg-neon rounded-full" />
                            )}
                            <ChildIcon size={15} className="flex-shrink-0 ml-2" />
                            <span>{child.label}</span>
                          </NavLink>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed submenu items shown directly */}
                {collapsed && item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const active = isActive(child.path);
                  return (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      title={child.label}
                      className={cn(
                        'flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-colors mt-1',
                        active ? 'bg-navy text-white' : 'text-grayLight hover:bg-navy/40 hover:text-white'
                      )}
                    >
                      <ChildIcon size={16} />
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          const active = isActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              onClick={() => isMobile && dispatch(setMobileMenuOpen(false))}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors relative',
                active
                  ? 'bg-navy text-white'
                  : 'text-grayLight hover:bg-navy/40 hover:text-white'
              )}
            >
              {active && !collapsed && (
                <div className="absolute left-0 w-1 h-6 bg-neon rounded-full" />
              )}
              <Icon size={18} className={cn('flex-shrink-0', active && !collapsed && 'ml-2')} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      {/* User card at bottom */}
      <div className={cn(
        'border-t border-white/10 px-3 py-4',
        collapsed ? 'flex justify-center' : 'flex items-center gap-3'
      )}>
        <div className="w-8 h-8 rounded-full bg-neon/20 border border-neon/40 flex items-center justify-center flex-shrink-0">
          <span className="text-neon font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <p className="text-white text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-grayLight text-xs truncate">{user?.role || 'customer'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
