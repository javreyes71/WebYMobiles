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
          'relative inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs lg:text-sm font-extrabold uppercase tracking-wider transition-all duration-200';
        if (accent) {
          return `${base} ${
            isActive
              ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300'
              : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-300'
          }`;
        }
        return `${base} ${
          isActive
            ? 'bg-gray-900 text-white shadow-sm ring-2 ring-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
