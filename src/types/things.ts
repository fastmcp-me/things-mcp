export type ThingsCommand = 
  | 'add'
  | 'add-project'
  | 'update'
  | 'update-project'
  | 'show'
  | 'search'
  | 'json';

export type WhenValue = 
  | 'today'
  | 'tomorrow'
  | 'evening'
  | 'anytime'
  | 'someday'
  | string; // ISO date format

export type ShowTarget = 
  | 'today'
  | 'anytime'
  | 'upcoming'
  | 'someday'
  | 'logbook'
  | 'deadlines'
  | string; // ID of specific item

export interface AddTodoParams {
  title: string;
  notes?: string;
  when?: WhenValue;
  deadline?: string;
  tags?: string;
  'checklist-items'?: string;
  list?: string;
  heading?: string;
  completed?: boolean;
  canceled?: boolean;
}

export interface AddProjectParams {
  title: string;
  notes?: string;
  when?: WhenValue;
  deadline?: string;
  tags?: string;
  area?: string;
  'to-dos'?: string;
  completed?: boolean;
  canceled?: boolean;
}

export interface UpdateTodoParams {
  id: string;
  'auth-token': string;
  title?: string;
  notes?: string;
  when?: WhenValue;
  deadline?: string;
  tags?: string;
  'checklist-items'?: string;
  list?: string;
  heading?: string;
  completed?: boolean;
  canceled?: boolean;
  'prepend-notes'?: string;
  'append-notes'?: string;
  'add-tags'?: string;
  'add-checklist-items'?: string;
}

export interface UpdateProjectParams {
  id: string;
  'auth-token': string;
  title?: string;
  notes?: string;
  when?: WhenValue;
  deadline?: string;
  tags?: string;
  area?: string;
  completed?: boolean;
  canceled?: boolean;
  'prepend-notes'?: string;
  'append-notes'?: string;
  'add-tags'?: string;
}

export interface ShowParams {
  id?: ShowTarget;
  query?: string;
}

export interface SearchParams {
  query?: string;
}

export interface JsonTodo {
  type: 'to-do';
  attributes: {
    title: string;
    notes?: string;
    when?: WhenValue;
    deadline?: string;
    tags?: string[];
    'checklist-items'?: Array<{ title: string; completed?: boolean }>;
    completed?: boolean;
    canceled?: boolean;
  };
}

export interface JsonProject {
  type: 'project';
  attributes: {
    title: string;
    notes?: string;
    when?: WhenValue;
    deadline?: string;
    tags?: string[];
    area?: string;
    items?: Array<JsonTodo | JsonHeading>;
    completed?: boolean;
    canceled?: boolean;
  };
}

export interface JsonHeading {
  type: 'heading';
  attributes: {
    title: string;
  };
}

export interface JsonImportParams {
  data: Array<JsonTodo | JsonProject | JsonHeading>;
  reveal?: boolean;
}

export type ThingsParams = 
  | AddTodoParams
  | AddProjectParams
  | UpdateTodoParams
  | UpdateProjectParams
  | ShowParams
  | SearchParams
  | JsonImportParams;