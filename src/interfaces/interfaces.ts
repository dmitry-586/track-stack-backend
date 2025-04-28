export interface User {
	userId: string;
	email: string;
	password: string;
	userSkills: UserSkill[];
	userRoadmaps: UserRoadmap[];
}

export interface Skill {
	skillId: string;
	name: string;
	progress: number;
	userSkills: UserSkill[];
	roadmaps: RoadmapSkill[];
}

export interface Roadmap {
	roadmapId: string;
	title: string;
	complexity: string;
	color: string;
	stages: number;
	technologies: string;
	progress: number;
	isPublic: boolean;
	skills: RoadmapSkill[];
	userRoadmaps: UserRoadmap[];
}

export interface UserSkill {
	userId: string;
	skillId: string;
	progress: number;
	user?: User;
	skill?: Skill;
}

export interface RoadmapSkill {
	roadmapId: string;
	skillId: string;
	roadmap?: Roadmap;
	skill?: Skill;
}

export interface UserRoadmap {
	userId: string;
	roadmapId: string;
	progress: number;
	user?: User;
	roadmap?: Roadmap;
}

export interface FocusSkill extends Skill {
	focusProgress: number;
}

export interface Task {
	taskId: string;
	title: string;
	completed: boolean;
	skillId: string;
	skill?: Skill;
}
