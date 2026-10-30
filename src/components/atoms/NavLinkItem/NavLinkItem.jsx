import React from 'react';
import { NavLink } from 'react-router-dom';

const NavLinkItem = ({ to, children, badge = null, accent = false, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === '/'}
      className={({ isActive }) => {
        const base =
          'relative inline-flex items-center gap-1.5 py-1.5 text-xs lg:text-sm font-bold uppercase tracking-wider transition-colors';
        if (accent) {
          return `${base} px-3 rounded-full ${
            isActive
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
          }`;
        }
        return `${base} ${
          isActive
            ? 'text-black after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-black'
            : 'text-gray-600 hover:text-black'
        }`;
      }}
    >
      <span>{children}</span>
      {badge && (
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-sky-600 text-white leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export default NavLinkItem;
