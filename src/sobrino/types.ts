export type Piece = {
  id: string;
  title: string;
  price: number;
  image: string;
  createdAt: number;
};

export type Intent =
  | { type: 'add'; title?: string; price?: number }
  | { type: 'sold'; pieceIds: string[] }
  | { type: 'price'; pieceIds: string[]; price?: number }
  | { type: 'photo'; pieceIds: string[] }
  | { type: 'undo' }
  | { type: 'smalltalk' }
  | { type: 'unknown' };

export type Message =
  | { kind: 'photo'; image: string }
  | { kind: 'intent'; intent: Intent }
  | { kind: 'button'; label: string };

export type Reply = { text: string; image?: string; buttons?: string[] };

export type Pending =
  | { type: 'confirmSold'; pieceId: string }
  | { type: 'confirmPrice'; price: number; then: Intent }
  | { type: 'choosePiece'; options: { id: string; label: string }[]; then: Intent };

export type Session = {
  catalog: Piece[];
  /** Foto recibida que todavía no se usó. */
  pendingPhoto?: string;
  /** Datos de una pieza nueva a medio cargar. */
  draft?: { title?: string; price?: number };
  /** Pieza que está esperando su foto nueva. */
  photoFor?: string;
  /** Pregunta abierta que se responde con un botón. */
  pending?: Pending;
  /** Catálogo anterior al último cambio, para deshacer. */
  previous?: Piece[];
  /** Cuándo avisó por última vez que estaba en vivo. */
  liveNoteAt?: number;
};
