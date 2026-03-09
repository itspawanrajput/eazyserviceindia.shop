import React, { useState, useEffect, useRef } from 'react';
import { useVisualBuilder } from '../context/VisualBuilderContext';
import { Settings, Trash2, Copy } from 'lucide-react';

interface EditableProps {
  id: string;
  children: React.ReactElement;
  type: 'text' | 'button' | 'image' | 'icon' | 'section' | 'link' | 'social';
}

const Editable: React.FC<EditableProps> = ({ id, children, type }) => {
  const { isEditMode, selectedElementId, setSelectedElementId, setSelectedElementType, pageData, setPageData, device } = useVisualBuilder();
  const isSelected = selectedElementId === id;
  const elementRef = useRef<HTMLDivElement>(null);

  // Recursively extract plain text from React children
  const extractText = (c: any): string => {
    if (typeof c === 'string') return c;
    if (typeof c === 'number') return String(c);
    if (Array.isArray(c)) return c.map(extractText).filter(Boolean).join(' ');
    if (c && typeof c === 'object' && c.props?.children) return extractText(c.props.children);
    return '';
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedElementId(id);
    setSelectedElementType(type);

    // Seed pageData with real component values on first click so the panel is never empty
    const newData = { ...pageData };
    if (!newData[id]) newData[id] = {};
    if (!newData[id][device]) newData[id][device] = {};
    const d = newData[id][device];

    if (type === 'button') {
      // Seed text from children, link from href (if child is an <a>)
      if (!d.text) {
        const text = extractText(children.props.children).trim();
        if (text) d.text = text;
      }
      if (!d.link) {
        const href = children.props.href || '';
        if (href) d.link = href;
      }
    }

    if (type === 'link' || type === 'social') {
      if (!d.link) {
        d.link = children.props.href || '';
      }
      if (!d.text) {
        const text = extractText(children.props.children).trim();
        if (text) d.text = text;
      }
    }

    if (type === 'text') {
      if (!d.value) {
        const text = extractText(children.props.children).trim();
        if (text) d.value = text;
      }
    }

    if (type === 'image') {
      if (!d.value) {
        // Walk into children to find the first <img> src
        const findSrc = (node: any): string => {
          if (!node || typeof node !== 'object') return '';
          if (node.type === 'img' || node.props?.src) return node.props.src || '';
          if (node.props?.children) {
            const kids = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
            for (const k of kids) {
              const found = findSrc(k);
              if (found) return found;
            }
          }
          return '';
        };
        const src = children.props.src || findSrc(children);
        if (src) d.value = src;
      }
    }

    setPageData(newData);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (type !== 'text') return;
    const newText = e.target.innerText;
    updatePageData(newText);
  };

  const updatePageData = (value: any) => {
    const newData = { ...pageData };
    if (!newData[id]) newData[id] = {};
    if (!newData[id][device]) newData[id][device] = {};
    newData[id][device].value = value;
    setPageData(newData);
  };

  const elementData = pageData[id] || {};
  const currentStyles = elementData[device] || {};

  const style: React.CSSProperties = {
    fontSize: currentStyles.fontSize,
    fontWeight: currentStyles.fontWeight,
    color: currentStyles.color,
    margin: currentStyles.margin,
    padding: currentStyles.padding,
    backgroundColor: currentStyles.backgroundColor,
    backgroundImage: currentStyles.backgroundImage ? `url(${currentStyles.backgroundImage})` : undefined,
    backgroundSize: currentStyles.backgroundSize || 'cover',
    backgroundPosition: currentStyles.backgroundPosition || 'center',
  };

  const renderVideoBackground = () => {
    if (type !== 'section' || !currentStyles.backgroundVideo) return null;
    return (
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        src={currentStyles.backgroundVideo}
      />
    );
  };

  // ─── Non-edit mode rendering ───────────────────────────────────────────────
  if (!isEditMode) {
    const value = currentStyles.value;

    if (type === 'text' && value) {
      return React.cloneElement(children, {
        style: { ...children.props.style, ...style },
        children: value
      });
    }

    if (type === 'image' && value) {
      // image Editable wraps a <div> containing an <img>; clone the div and set src on inner img
      return React.cloneElement(children, {
        style: { ...children.props.style, ...style },
        src: value
      });
    }

    if (type === 'button') {
      const buttonText = currentStyles.text || children.props.children;
      const buttonLink = currentStyles.link || children.props.href;
      return React.cloneElement(children, {
        style: { ...children.props.style, ...style },
        children: buttonText,
        onClick: buttonLink ? () => {
          if (buttonLink.startsWith('http') || buttonLink.startsWith('tel:') || buttonLink.startsWith('mailto:')) {
            window.location.href = buttonLink;
          } else {
            const el = document.getElementById(buttonLink.replace('#', ''));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        } : children.props.onClick
      });
    }

    if (type === 'link') {
      const linkText = currentStyles.text || children.props.children;
      const linkHref = currentStyles.link || children.props.href;
      // Support custom icon image for links (e.g. WhatsApp button)
      const iconUrl = currentStyles.iconImage;
      const cloned = React.cloneElement(children, {
        style: { ...children.props.style, ...style },
        children: iconUrl
          ? <img src={iconUrl} alt="icon" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
          : linkText,
        href: linkHref || children.props.href,
        onClick: (e: React.MouseEvent) => {
          if (linkHref && !linkHref.startsWith('http') && !linkHref.startsWith('tel:') && !linkHref.startsWith('mailto:')) {
            e.preventDefault();
            const el = document.getElementById(linkHref.replace('#', ''));
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
      return cloned;
    }

    if (type === 'icon' && value) {
      return (
        <div style={style}>
          <img src={value} alt="icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      );
    }

    if (type === 'social') {
      const socialLink = currentStyles.link || children.props.href;
      const socialIcon = currentStyles.iconImage;
      return React.cloneElement(children, {
        href: socialLink || children.props.href,
        children: socialIcon
          ? <img src={socialIcon} alt="social icon" className="w-5 h-5 object-contain rounded-full" referrerPolicy="no-referrer" />
          : children.props.children,
      });
    }

    if (type === 'section') {
      return (
        <div className="relative overflow-hidden" style={style}>
          {renderVideoBackground()}
          <div className="relative z-10">
            {React.cloneElement(children, { style: { ...children.props.style, backgroundColor: 'transparent', backgroundImage: 'none' } })}
          </div>
        </div>
      );
    }

    return React.cloneElement(children, { style: { ...children.props.style, ...style } });
  }

  // ─── Edit mode rendering ───────────────────────────────────────────────────
  const labelColor =
    type === 'social' ? 'bg-pink-600' :
    type === 'link' ? 'bg-green-600' :
    type === 'section' ? 'bg-purple-600' :
    type === 'image' ? 'bg-orange-600' :
    'bg-blue-600';

  return (
    <div
      ref={elementRef}
      onClick={handleClick}
      className={`relative group transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1'}`}
    >
      {isSelected && (
        <div className={`absolute -top-8 left-0 flex items-center gap-1 ${labelColor} text-white text-[10px] font-bold px-2 py-1 rounded-t-lg z-[100]`}>
          <span className="uppercase">{type}</span>
          <div className="flex items-center gap-1 ml-2 border-l border-white/20 pl-2">
            <button className="hover:text-blue-200"><Settings className="w-3 h-3" /></button>
            <button className="hover:text-blue-200"><Copy className="w-3 h-3" /></button>
            <button className="hover:text-red-200"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {type === 'section' && renderVideoBackground()}

      <div className="relative z-10">
        {type === 'text' ? (
          <div
            contentEditable={isEditMode}
            onBlur={handleBlur}
            suppressContentEditableWarning={true}
            className="outline-none"
            style={style}
          >
            {currentStyles.value || children.props.children}
          </div>
        ) : type === 'image' ? (
          React.cloneElement(children, {
            style: { ...children.props.style, ...style },
            src: currentStyles.value || children.props.src
          })
        ) : type === 'button' || type === 'link' ? (
          React.cloneElement(children, {
            style: { ...children.props.style, ...style },
            children: currentStyles.iconImage
              ? <img src={currentStyles.iconImage} alt="icon" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              : (currentStyles.text || children.props.children)
          })
        ) : type === 'icon' && currentStyles.value ? (
          <div style={style} className="w-full h-full">
            <img src={currentStyles.value} alt="icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
        ) : type === 'social' ? (
          React.cloneElement(children, {
            style: { ...children.props.style, ...style },
            children: currentStyles.iconImage
              ? <img src={currentStyles.iconImage} alt="social icon" className="w-5 h-5 object-contain rounded-full" referrerPolicy="no-referrer" />
              : children.props.children
          })
        ) : (
          React.cloneElement(children, { style: { ...children.props.style, ...style } })
        )}
      </div>
    </div>
  );
};

export default Editable;
