// A small painted Finder. Portfolio content stays data, never HTML.
import { watercolorReveal, cancelWatercolor } from './brush-study-wash.js?v=objects-20261103a';
let browserSequence = 0;
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const readable = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';
const projectURL = value => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};

function paintedFile(id, isDocument = false) {
  const mark = node('span', `project-browser-mark${isDocument ? ' is-document' : ''}`);
  mark.setAttribute('aria-hidden', 'true');
  if(!isDocument){const image=node('img','painted-folder-bitmap');image.src='/assets/painted/finder-folder-watercolor-v1.webp';image.alt='';image.draggable=false;mark.append(image);return mark;}
  mark.innerHTML = isDocument
    ? `<svg viewBox="0 0 104 100" focusable="false"><defs><filter id="${id}" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".068" numOctaves="2" seed="7" result="paper"/><feDisplacementMap in="SourceGraphic" in2="paper" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g filter="url(#${id})"><path d="M24 12 62 11 81 31 80 88 24 88 20 82 21 18Z" fill="#dedccc" opacity=".8"/><path d="M25 15 61 14 77 31 76 84 26 85 23 79Z" fill="#faf7ed"/><path d="m61 14 1 18 15-1" fill="#b4c7cb" opacity=".6"/><path d="m31 46 33-1m-33 8 34-1m-34 8 25 1m-25 8 31-1" fill="none" stroke="#9aabae" opacity=".5" stroke-width="1.2" stroke-linecap="round"/></g><path d="m26 13 34-1m19 23-1 45-2 5-44 1" fill="none" stroke="#a2aa9d" stroke-width=".7" opacity=".6"/></svg>`
    : `<svg viewBox="0 0 130 100" focusable="false"><defs><filter id="${id}" x="-12%" y="-15%" width="125%" height="135%"><feTurbulence type="fractalNoise" baseFrequency=".067" numOctaves="2" seed="5" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g filter="url(#${id})"><path d="M13 29 18 22 45 22 53 30 112 28 118 35 115 81 109 85 17 84 12 79Z" fill="#8baeba" opacity=".74"/><path d="M13 39 20 36 111 35 120 40 113 82 105 86 18 83 11 78Z" fill="#91b8c6" opacity=".71"/><path d="m17 69 96 1-2 12-8 3-84-3-5-7Z" fill="#698d9c" opacity=".19"/></g><path d="m18 24 26-1 10 8 57-1m6 11-5 38-8 5-83-2m-7-7-1-33 8-4 88-1" fill="none" stroke="#6d929f" stroke-width="1.05" opacity=".56" stroke-linecap="round"/><path d="m23 47 43-2m9 0 22 1m-70 30 28 1" fill="none" stroke="#f5f5e8" stroke-width="2" opacity=".47" stroke-linecap="round"/></svg>`;
  return mark;
}

function viewSymbol(list = false) {
  const symbol = node('span', 'project-browser-view-symbol');
  symbol.setAttribute('aria-hidden', 'true');
  symbol.innerHTML = list
    ? '<svg viewBox="0 0 20 20" focusable="false"><path d="M7 5h10M7 10h10M7 15h10" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/><path d="M3 4h2v2H3zm0 5h2v2H3zm0 5h2v2H3z" fill="currentColor" opacity=".6"/></svg>'
    : '<svg viewBox="0 0 20 20" focusable="false"><path d="M3 3h5v5H3zm9 0h5v5h-5zM3 12h5v5H3zm9 0h5v5h-5z" fill="none" stroke="currentColor" stroke-width="1.05" stroke-linejoin="round"/></svg>';
  return symbol;
}

export function createPaintedProjectBrowser({ items = [], announce = () => {} } = {}) {
  const uid = `painted-project-browser-${++browserSequence}`;
  const projects = (Array.isArray(items) ? items : []).filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => ({
    title: readable(item.title || item.name) || 'Untitled project',
    description: readable(item.description),
    tags: (Array.isArray(item.tags) ? item.tags : []).map(readable).filter(Boolean),
    url: projectURL(item.url),
    contribution: /\/pull\/\d+$/.test(item.url || ''),
    document: item.type === 'document' || item.kind === 'document',
  }));
  const element = node('section', 'painted-project-browser');
  element.dataset.view = 'icons';
  element.setAttribute('aria-label', 'Projects browser');
  const toolbar = node('div', 'project-browser-toolbar');
  const count = projects.length;
  const countLabel = node('span', 'project-browser-count', `${count} ${count === 1 ? 'item' : 'items'}`);
  const views = node('div', 'project-browser-view-options');
  views.setAttribute('role', 'group');
  views.setAttribute('aria-label', 'Project view');
  const iconView = node('button', 'project-browser-view-button');
  iconView.type = 'button';
  iconView.setAttribute('aria-label', 'Show projects as icons');
  iconView.setAttribute('aria-pressed', 'true');
  iconView.append(viewSymbol());
  const listView = node('button', 'project-browser-view-button');
  listView.type = 'button';
  listView.setAttribute('aria-label', 'Show projects as a list');
  listView.setAttribute('aria-pressed', 'false');
  listView.append(viewSymbol(true));
  views.append(iconView, listView);
  toolbar.append(countLabel, views);
  const body = node('div', 'project-browser-body');
  const collection = node('div', 'project-browser-collection');
  const listHeading = node('div', 'project-browser-list-heading');
  listHeading.setAttribute('aria-hidden', 'true');
  listHeading.append(node('span', '', 'Name'), node('span', '', 'Tags'));
  const listbox = node('div', 'project-browser-items');
  listbox.setAttribute('role', 'listbox');
  listbox.setAttribute('aria-label', 'Project files');
  listbox.setAttribute('aria-describedby', `${uid}-help`);
  const help = node('p', 'project-browser-sr-only', 'Use the arrow keys to select a project and read its preview. Home and End select the first and last project.');
  help.id = `${uid}-help`;
  const preview = node('aside', 'project-browser-preview');
  preview.tabIndex = 0;
  preview.setAttribute('aria-labelledby', `${uid}-preview-title`);
  const previewTitle = node('h4', 'project-browser-preview-title');
  previewTitle.id = `${uid}-preview-title`;
  const previewArt = node('div', 'project-browser-preview-art');
  const previewKind = node('p', 'project-browser-preview-kind');
  const previewDescription = node('p', 'project-browser-description');
  const previewTags = node('ul', 'project-browser-tags');
  previewTags.setAttribute('aria-label', 'Project tags');
  const previewLink = node('a', 'project-browser-visit', 'Visit project ↗');
  previewLink.target = '_blank';
  previewLink.rel = 'noopener noreferrer';
  const linkEmpty = node('p', 'project-browser-link-empty', 'No project link added yet.');
  preview.append(previewArt, previewKind, previewTitle, previewDescription, previewTags, previewLink, linkEmpty);
  collection.append(listHeading, listbox, help);
  body.append(collection, preview);
  element.append(toolbar, body);

  let selection = count ? 0 : -1;
  let mode = 'icons';
  let previewPaint = null;
  let previewVisit = 0;
  let hasPreview = false;
  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const options = projects.map((project, index) => {
    const option = node('button', 'project-browser-file');
    option.type = 'button';
    option.id = `${uid}-file-${index}`;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-label', project.title);
    option.setAttribute('aria-selected', index === selection ? 'true' : 'false');
    option.setAttribute('aria-controls', `${uid}-preview`);
    option.tabIndex = index === selection ? 0 : -1;
    option.append(paintedFile(`${uid}-grain-${index}`, project.document), node('span', 'project-browser-file-name', project.title), node('span', 'project-browser-file-meta', project.tags.join(', ') || '—'));
    option.addEventListener('click', () => {
      select(index);
      if(window.matchMedia('(max-width: 650px)').matches)preview.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    });
    option.addEventListener('keydown', event => {
      let next;
      const columns = columnCount();
      if (event.key === 'ArrowRight') next = selection + 1;
      else if (event.key === 'ArrowLeft') next = selection - 1;
      else if (event.key === 'ArrowDown') next = selection + columns;
      else if (event.key === 'ArrowUp') next = selection - columns;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = count - 1;
      else return;
      event.preventDefault();
      select(Math.max(0, Math.min(count - 1, next)), true);
    });
    listbox.append(option);
    return option;
  });
  preview.id = `${uid}-preview`;

  function columnCount() {
    if (mode === 'list' || options.length < 2) return 1;
    const top = options[0].getBoundingClientRect().top;
    return Math.max(1, options.filter(option => Math.abs(option.getBoundingClientRect().top - top) < 2).length);
  }
  function select(index, focus = false, speak = true) {
    if (!projects[index]) return;
    const changed = selection !== index;
    if (!changed && hasPreview) {
      if (focus) {
        options[index].focus({ preventScroll: true });
        options[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      return;
    }
    if (changed) {
      previewPaint?.cancel();
      cancelWatercolor(preview);
      previewPaint = null;
    }
    selection = index;
    options.forEach((option, optionIndex) => {
      const selected = optionIndex === index;
      option.setAttribute('aria-selected', String(selected));
      option.tabIndex = selected ? 0 : -1;
    });
    const project = projects[index];
    previewArt.replaceChildren(paintedFile(`${uid}-preview-grain`, project.document));
    previewArt.hidden = project.contribution;
    previewKind.textContent = project.contribution ? 'Pull request' : project.document ? 'Project document' : 'Project folder';
    previewLink.textContent = project.contribution ? 'View pull request ↗' : 'Visit project ↗';
    previewTitle.textContent = project.title;
    previewDescription.textContent = project.description || 'A description hasn’t been added yet.';
    previewTags.replaceChildren(...project.tags.map(tag => node('li', '', tag)));
    previewTags.hidden = !project.tags.length;
    previewLink.hidden = !project.url;
    linkEmpty.hidden = Boolean(project.url);
    if (project.url) previewLink.href = project.url;
    else previewLink.removeAttribute('href');
    hasPreview = true;
    if (changed) {
      const effect = watercolorReveal(preview, {
        kind: 'ink', duration: 430, seed: 37 + ++previewVisit,
        reduced: () => Boolean(motionPreference?.matches),
      });
      previewPaint = effect;
      effect.finished.then(() => { if (previewPaint === effect) previewPaint = null; });
    }
    if (focus) {
      options[index].focus({ preventScroll: true });
      options[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (speak && typeof announce === 'function') announce(`${project.title} selected. Preview updated.`);
  }
  function setView(value) {
    if (mode === value) return;
    mode = value;
    element.dataset.view = value;
    iconView.setAttribute('aria-pressed', String(value === 'icons'));
    listView.setAttribute('aria-pressed', String(value === 'list'));
    if (selection >= 0) options[selection].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (typeof announce === 'function') announce(value === 'icons' ? 'Projects shown as icons.' : 'Projects shown as a list.');
  }
  iconView.addEventListener('click', () => setView('icons'));
  listView.addEventListener('click', () => setView('list'));
  if (count) select(0, false, false);
  else {
    element.classList.add('is-empty');
    listbox.hidden = true;
    preview.hidden = true;
    const empty = node('div', 'project-browser-empty');
    empty.append(paintedFile(`${uid}-empty-grain`), node('h4', '', 'A little room for the next idea.'), node('p', '', 'Projects will appear in this folder as they’re added.'));
    collection.append(empty);
  }
  return { element, count };
}
