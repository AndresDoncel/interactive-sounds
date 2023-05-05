import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService {

  fftSize: number = 256;

  constructor() { }

  getMicrophoneStream(threshold = 0.02): Observable<Uint8Array> {
    return new Observable<Uint8Array>(observer => {
      const audioContext = new AudioContext();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = this.fftSize;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let stream: MediaStream;

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(s => {
          stream = s;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyserNode);
          const intervalId = setInterval(() => {
            analyserNode.getByteFrequencyData(dataArray);
            const amplitude = Math.max(...dataArray);
            if (amplitude > threshold) {
              observer.next(dataArray);
            }
          }, 30);
          return () => {
            clearInterval(intervalId);
            stream.getTracks().forEach(track => track.stop());
          };
        })
        .catch(err => {
          observer.error(err);
          observer.complete();
        });
    });
  }

  mapToDb(dataArray: Uint8Array): number {
    const bufferSize = dataArray.length;
    let total = 0;
    for (let i = 0; i < bufferSize; i++) {
      total += Math.abs(dataArray[i]);
    }
    const rms = Math.sqrt(total / bufferSize);
    const db = 20 * Math.log10(rms);

    return db;
  }

}
