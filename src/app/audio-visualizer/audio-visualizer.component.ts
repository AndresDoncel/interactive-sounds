import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { AudioRecorderService } from '../share/services/microfone.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Subject, Subscription, takeUntil } from 'rxjs';

@Component({
  selector: 'app-audio-visualizer',
  standalone: true,
  providers: [AudioRecorderService],
  imports: [CommonModule],
  template: '<div id="rendererContainer"></div>',
})
export class AudioVisualizerComponent implements AfterViewInit {
  private cube!: THREE.Mesh;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  public controls!: OrbitControls;
  private audio!: HTMLAudioElement;
  private audioCtx!: AudioContext;
  private audioSrc!: MediaElementAudioSourceNode;
  private analyser!: AnalyserNode;
  private dataArray!: Uint8Array;

  public audioStreamSubscription!: Subscription;
  public destroy$ = new Subject<void>();

  constructor(private elRef: ElementRef, private audioRecorderService: AudioRecorderService) { }

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.initAudio();
    this.initCube();

    this.renderScene();

    this.initAudioStreamSubscription();
  }

  private initThreeJs() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.elRef.nativeElement.querySelector('#rendererContainer').appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  private initAudio() {
    this.audio = new Audio();
    document.body.appendChild(this.audio);

    this.audioCtx = new AudioContext();
    this.audioSrc = this.audioCtx.createMediaElementSource(this.audio);
    this.analyser = this.audioCtx.createAnalyser();
    this.audioSrc.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.analyser.fftSize = 256;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  private initCube() {
    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);
  }

  private renderScene() {
    const render = () => {
      requestAnimationFrame(render);

      this.analyser.getByteFrequencyData(this.dataArray);

      const scaleVal = (10 / 255) * 2 + 0.1;
      this.cube.scale.set(scaleVal, scaleVal, scaleVal);

      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  private initAudioStreamSubscription() {
    this.audioStreamSubscription = this.audioRecorderService.getMicrophoneStream().pipe(
      takeUntil(this.destroy$)
    ).subscribe(dataArray => {
      const db = this.audioRecorderService.mapToDb(dataArray);

      const color = new THREE.Color(`hsl(${db * 60}, 100%, 50%)`);
      if (this.cube.material instanceof THREE.MeshBasicMaterial) {
        this.cube.material.color = color;
      }

      this.renderer.render(this.scene, this.camera);
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete
  }
}
