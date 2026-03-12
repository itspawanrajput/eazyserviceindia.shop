import React, { useState, useEffect, useRef } from 'react';
import { useVisualBuilder } from '../context/VisualBuilderContext';
import { Settings, Trash2, Copy } from 'lucide-react';

// Recursively clone a React element tree, replacing the first <img>'s src
const cloneWithImgSrc = (element: any, newSrc: string, imgStyle?: React.CSSProperties): any => {
  if (!element || !React.isValidElement(element)) return element;

  // If this specific element is an img (or has a src prop), update it
  const isImg = element.type === 'img' || (element.props as any)?.src !== undefined;
  if (isImg) {
    return React.cloneElement(element, {
      src: newSrc,
      style: { ...(element.props as any)?.style, ...imgStyle }
    } as any);
  }

  // Walk into children
  const kids = (element.props as any)?.children;
  if (kids) {
    if (Array.isArray(kids)) {
      let found = false;
      const newKids = kids.map((kid: any) => {
        if (found) return kid;
        const result = cloneWithImgSrc(kid, newSrc, imgStyle);
        if (result !== kid) found = true;
        return result;
      });
      if (found) return React.cloneElement(element, { ...element.props, children: newKids });
    } else {
      const result = cloneWithImgSrc(kids, newSrc, imgStyle);
      if (result !== kids) return React.cloneElement(element, { ...element.props, children: result });
    }
  }
  return element;
};

interface EditableProps {
  id: string;
  children: React.ReactElement;
  type: 'text' | 'button' | 'image' | 'icon' | 'section' | 'link' | 'social';
  className?: string;
}

const Editable: React.FC<EditableProps> = ({ id, children, type, className = '' }) => {
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

  // Image-specific styles
  const imgStyle: React.CSSProperties = {
    objectFit: (currentStyles.objectFit as any) || 'cover',
    objectPosition: currentStyles.objectPosition || 'center',
    width: currentStyles.imgWidth || undefined,
    height: currentStyles.imgHeight || undefined,
    borderRadius: currentStyles.imgBorderRadius || undefined,
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
        children: value,
        className: `${children.props.className || ''} ${className}`.trim()
      });
    }

    if (type === 'image' && value) {
      const cloned = cloneWithImgSrc(children, value, imgStyle);
      return React.cloneElement(cloned, { 
        className: `${cloned.props.className || ''} ${className}`.trim() 
      });
    }

    if (type === 'button') {
      const buttonText = currentStyles.text || children.props.children;
      const buttonLink = currentStyles.link || children.props.href;
      return React.cloneElement(children, {
        style: { ...children.props.style, ...style },
        className: `${children.props.className || ''} ${className}`.trim(),
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
      const iconUrl = currentStyles.iconImage;
      return React.cloneElement(children, {
        style: { ...children.props.style, ...style },
        className: `${children.props.className || ''} ${className}`.trim(),
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
    }

    if (type === 'icon' && value) {
      return (
        <div style={style} className={className}>
          <img src={value} alt="icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
      );
    }

    if (type === 'social') {
      const socialLink = currentStyles.link || children.props.href;
      const socialIcon = currentStyles.iconImage;
      return React.cloneElement(children, {
        href: socialLink || children.props.href,
        className: `${children.props.className || ''} ${className}`.trim(),
        children: socialIcon
          ? <img src={socialIcon} alt="social icon" className="w-5 h-5 object-contain rounded-full" referrerPolicy="no-referrer" />
          : children.props.children,
      });
    }

    if (type === 'section') {
      // Only wipe original bg if we have a replacement background or video
      const hasReplacementBg = currentStyles.backgroundImage || currentStyles.backgroundColor || currentStyles.backgroundVideo;
      return (
        <div className={`relative overflow-hidden ${className}`.trim()} style={style}>
          {renderVideoBackground()}
          {hasReplacementBg ?
            React.cloneElement(children, { 
              style: { ...children.props.style, backgroundColor: 'transparent', backgroundImage: 'none' } 
            }) :
            children
          }
        </div>
      );
    }

    // Default passthrough
    return React.cloneElement(children, { 
      style: { ...children.props.style, ...style },
      className: `${children.props.className || ''} ${className}`.trim()
    });
  }

  // ─── Edit mode rendering ───────────────────────────────────────────────────
  const labelColor =
    type === 'social' ? 'bg-pink-600' :
    type === 'link' ? 'bg-green-600' :
    type === 'section' ? 'bg-purple-600' :
    type === 'image' ? 'bg-orange-600' :
    'bg-blue-600';

  // Ensure the wrapper doesn't collapse flex/grid layouts
  const isSizedType = type === 'image' || type === 'section' || type === 'button';
  const sizeClasses = isSizedType ? 'w-full h-full' : '';

  return (
    <div
      ref={elementRef}
      onClick={handleClick}
      className={`relative group transition-all duration-200 ${sizeClasses} ${className} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1'}`}
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
        cloneWithImgSrc(
          children,
          currentStyles.value || children.props.src || '',
          imgStyle
        )
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
  );
};

export default Editable;
