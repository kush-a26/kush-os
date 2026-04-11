export const COMPANIES = {
  marrow:   { label: 'Marrow',       color: '#62C8DF', dim: 'rgba(98,200,223,0.15)',  wfo: [2,4] },  // Tue, Thu
  yaas:     { label: 'Yaas',         color: '#E8B86D', dim: 'rgba(232,184,109,0.15)', wfo: [1,6] },  // Mon, Sat
  dognosis: { label: 'Dognosis',     color: '#B39DDB', dim: 'rgba(179,157,219,0.15)', wfo: [] },
  college:  { label: 'College',      color: '#81C784', dim: 'rgba(129,199,132,0.15)', wfo: [] },
  personal: { label: 'Personal',     color: '#F48FB1', dim: 'rgba(244,143,177,0.15)', wfo: [] },
}

export const STATUSES = {
  todo:       { label: 'To Do',       bg: '#1e1e24', fg: '#9090a0' },
  inprogress: { label: 'In Progress', bg: 'rgba(98,200,223,0.18)', fg: '#62C8DF' },
  review:     { label: 'Review',      bg: 'rgba(240,201,100,0.22)', fg: '#F0C964' },
  blocked:    { label: 'Blocked',     bg: 'rgba(229,115,115,0.2)', fg: '#EF9A9A' },
  done:       { label: 'Done',        bg: 'rgba(80,80,95,0.25)', fg: '#6b6b7e' },
}

export const PRIORITIES = {
  high: { label: 'High', color: '#EF9A9A' },
  med:  { label: 'Med',  color: '#FFD54F' },
  low:  { label: 'Low',  color: '#6b6b7e' },
}

// What company context is today — drives the NOW block
export function getDayContext(dow) {
  const contexts = {
    0: { primary: 'dognosis', label: 'Rest + Dognosis day', commute: false },
    1: { primary: 'yaas',     label: 'Yaas WFO day',        commute: true,  commuteNote: '~1.5hr to Yaas' },
    2: { primary: 'marrow',   label: 'Marrow WFO day',       commute: true,  commuteNote: '~1.5hr to Marrow' },
    3: { primary: 'marrow',   label: 'WFH deep work day',    commute: false },
    4: { primary: 'marrow',   label: 'Marrow WFO day',       commute: true,  commuteNote: '~1.5hr to Marrow' },
    5: { primary: 'marrow',   label: 'WFH day',              commute: false },
    6: { primary: 'yaas',     label: 'Yaas WFO + College',   commute: true,  commuteNote: '~1.5hr to Yaas' },
  }
  return contexts[dow] || contexts[0]
}
