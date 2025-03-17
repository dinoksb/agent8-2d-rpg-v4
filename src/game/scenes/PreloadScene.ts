import Phaser from "phaser";
import { generateProceduralTextures } from "../utils/generateProceduralTextures";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    console.log("PreloadScene: Loading assets...");
    
    // 외부 에셋 기본 URL 설정
    this.load.setBaseURL('https://agent8-games.verse8.io/assets');
    
    // 기사 스프라이트 시트 및 설정 파일 로드 (외부 경로)
    this.load.spritesheet('knight', '2D/sprite_characters/knight.png', {
      frameWidth: 192,
      frameHeight: 192
    });
    this.load.json('knightConfig', '2D/sprite_characters/knight.json');
    
    // 다른 에셋들은 프로시저럴하게 생성
    const textures = generateProceduralTextures(this);
    
    // 로딩 진행 상황 표시
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    this.load.on('progress', function (value: number) {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      
      // 모든 에셋이 로드된 후 애니메이션 생성
      this.createAnimations();
    });
    
    // 에셋 로드 오류 처리
    this.load.on('loaderror', (fileObj: any) => {
      console.error(`Error loading asset: ${fileObj.key}`, fileObj);
      
      // 기사 스프라이트 로드 실패 시 프로시저럴 생성으로 대체
      if (fileObj.key === 'knight') {
        console.warn('Knight sprite failed to load, generating procedural fallback');
        this.generateProceduralKnight();
      }
    });
  }

  create() {
    console.log("PreloadScene: Assets loaded, creating animations...");
  }
  
  private createAnimations() {
    // 기사 설정 가져오기
    const knightConfig = this.cache.json.get('knightConfig');
    
    if (!knightConfig || !knightConfig.animations) {
      console.error("Knight config or animations not found!");
      // 기본 애니메이션 생성 (대체용)
      this.createDefaultAnimations();
      return;
    }
    
    // 설정에서 애니메이션 생성
    for (const animKey in knightConfig.animations) {
      const animData = knightConfig.animations[animKey];
      
      try {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers('knight', {
            start: animData.start,
            end: animData.end
          }),
          frameRate: animData.frameRate || 10,
          repeat: animData.repeat || 0
        });
        console.log(`Created animation: ${animKey}`);
      } catch (error) {
        console.error(`Failed to create animation ${animKey}:`, error);
      }
    }
    
    // 애니메이션이 생성되었는지 확인
    const requiredAnimations = ['idle', 'move', 'attack'];
    const missingAnimations = requiredAnimations.filter(key => !this.anims.exists(key));
    
    if (missingAnimations.length > 0) {
      console.error(`Missing required animations: ${missingAnimations.join(', ')}`);
      // 누락된 애니메이션에 대해 기본 애니메이션 생성
      this.createDefaultAnimations(missingAnimations);
    }
    
    // 애니메이션이 등록되었는지 확인하기 위해 짧은 지연 후 부트 씬 시작
    this.time.delayedCall(200, () => {
      console.log("PreloadScene: Starting BootScene...");
      this.scene.start("BootScene");
    });
  }
  
  private createDefaultAnimations(missingKeys?: string[]) {
    const defaults = {
      idle: { start: 0, end: 3, frameRate: 5, repeat: -1 },
      move: { start: 4, end: 11, frameRate: 10, repeat: -1 },
      attack: { start: 12, end: 17, frameRate: 15, repeat: 0 }
    };
    
    const keysToCreate = missingKeys || Object.keys(defaults);
    
    for (const key of keysToCreate) {
      const config = defaults[key as keyof typeof defaults];
      if (!config) continue;
      
      try {
        if (!this.anims.exists(key)) {
          this.anims.create({
            key: key,
            frames: this.anims.generateFrameNumbers('knight', {
              start: config.start,
              end: config.end
            }),
            frameRate: config.frameRate,
            repeat: config.repeat
          });
          console.log(`Created default animation: ${key}`);
        }
      } catch (error) {
        console.error(`Failed to create default animation ${key}:`, error);
      }
    }
  }
  
  private generateProceduralKnight() {
    // 외부 에셋 로드 실패 시에만 프로시저럴 기사 생성
    if (this.textures.exists('knight')) return;
    
    console.warn('Generating procedural knight texture as fallback');
    
    // 프레임 크기 및 총 프레임 수 설정
    const frameWidth = 192;
    const frameHeight = 192;
    const totalFrames = 18; // idle, move, attack 애니메이션에 충분한 프레임
    
    // 캔버스 생성
    const knightTexture = this.textures.createCanvas('knight', frameWidth * totalFrames, frameHeight);
    const knightContext = knightTexture.getContext();
    
    // 각 프레임에 대해 다른 포즈로 기사 그리기
    for (let i = 0; i < totalFrames; i++) {
      const x = i * frameWidth;
      
      // 프레임 영역 지우기
      knightContext.fillStyle = 'rgba(0,0,0,0)';
      knightContext.fillRect(x, 0, frameWidth, frameHeight);
      
      // 몸체 그리기 (프레임에 따라 약간의 변화)
      knightContext.fillStyle = '#3333aa';
      const bodyOffset = (i % 4) * 2; // 애니메이션을 위한 작은 움직임
      knightContext.fillRect(x + 80, 80 + bodyOffset, 32, 64 - bodyOffset);
      
      // 머리 그리기
      knightContext.fillStyle = '#ffccaa';
      knightContext.beginPath();
      knightContext.arc(x + 96, 64 + bodyOffset/2, 16, 0, Math.PI * 2);
      knightContext.fill();
      
      // 공격 프레임의 경우 팔 확장
      if (i >= 12) {
        knightContext.fillStyle = '#3333aa';
        const attackProgress = (i - 12) / 5; // 공격 애니메이션을 위한 0~1 값
        const armLength = 20 + 20 * attackProgress;
        knightContext.fillRect(x + 112, 90, armLength, 10);
      }
    }
    
    knightTexture.refresh();
    
    // 기본 기사 설정이 로드되지 않은 경우 생성
    if (!this.cache.json.exists('knightConfig')) {
      const defaultConfig = {
        body: {
          size: { width: 40, height: 40 },
          offset: { x: 76, y: 120 }
        },
        origin: { x: 0.5, y: 0.5 },
        animations: {
          idle: { start: 0, end: 3, frameRate: 5, repeat: -1 },
          move: { start: 4, end: 11, frameRate: 10, repeat: -1 },
          attack: { start: 12, end: 17, frameRate: 15, repeat: 0 }
        }
      };
      
      this.cache.json.add('knightConfig', defaultConfig);
    }
  }
}
