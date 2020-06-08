/*
    inputs:
    small001.3gp, small002.flv, small003.mp4, small004.ogv, small005.webm
    
    expectations:
    small003.mp4, small004.ogv, small005.webm -> untouched
    small001.3gp, small002.flv -> transcoded, renamed
*/

import { transcode, canPlayInputVideo } from "../src/import/transcode";
import { expect } from "chai";
import path from "path";
import { existsSync, unlinkSync, renameSync } from "fs";

const basePath = 'test/fixtures/files'

describe("Transcode videos", ()=>{
    describe("Process 3GP video", ()=>{
        const baseName = 'small001';
        const file = path.resolve(basePath, `${baseName}.3gp`);
        const expected = path.resolve(basePath, `${baseName}.mp4`);
        const renamedOriginal = path.resolve(basePath, `$_${baseName}.3gp`);

        after(()=>{
            //remove our expected output
            unlinkSync(expected);
            //rename 3gp file
            renameSync(renamedOriginal, file);
        });

        it("Should not match codec white-list", async ()=>{            
            const output = await canPlayInputVideo(file);
            expect(output).to.be.false;
        });
        it("Should transcode file", async ()=>{            
            const output = await transcode(file, baseName, [], false);            
            expect(output).to.eq(expected);            
        });
        it("Should create transcoded file", async ()=>{
            expect(existsSync(expected)).to.be.true;
        });
        it("Should create renamed original file", async ()=>{
            expect(existsSync(renamedOriginal)).to.be.true;
        });
        it("Transcoded file should match codec white-list", async ()=>{
            const output = await canPlayInputVideo(expected);
            expect(output).to.be.true;
        });        
    });

    describe("Process FLV video", ()=>{
        const baseName = 'small002';
        const file = path.resolve(basePath, `${baseName}.flv`);
        const expected = path.resolve(basePath, `${baseName}.mp4`);
        const renamedOriginal = path.resolve(basePath, `$_${baseName}.flv`);

        after(()=>{
            //remove our expected output
            unlinkSync(expected);
            //rename flv file
            renameSync(renamedOriginal, file);
        });

        it("Should not match codec white-list", async ()=>{            
            const output = await canPlayInputVideo(file);
            expect(output).to.be.false;
        });
        it("Should transcode file", async ()=>{            
            const output = await transcode(file, baseName, [], false);            
            expect(output).to.eq(expected);            
        });
        it("Should create transcoded file", async ()=>{
            expect(existsSync(expected)).to.be.true;
        });
        it("Should create renamed original file", async ()=>{
            expect(existsSync(renamedOriginal)).to.be.true;
        });
        it("Transcoded file should match codec white-list", async ()=>{
            const output = await canPlayInputVideo(expected);
            expect(output).to.be.true;
        });        
    });

    describe("Process MP4 video", ()=>{
        const file = path.resolve(basePath, 'small003.mp4');

        it("Should match codec white-list", async ()=>{            
            const output = await canPlayInputVideo(file);
            expect(output).to.be.true;
        });
        it("Should not be transcoded", async ()=>{
            const output = await transcode(file, 'small003', [], false);
            expect(output).to.eq(file);
        });
    });

    describe("Process OGV video", ()=>{
        const file = path.resolve(basePath, 'small004.ogv');

        it("Should match codec white-list", async ()=>{            
            const output = await canPlayInputVideo(file);
            expect(output).to.be.true;
        });
        it("Should not be transcoded", async ()=>{
            const output = await transcode(file, 'small004', [], false);
            expect(output).to.eq(file);
        });
    });

    describe("Process WebM video", ()=>{
        const file = path.resolve(basePath, 'small005.webm');

        it("Should match codec white-list", async ()=>{            
            const output = await canPlayInputVideo(file);
            expect(output).to.be.true;
        });
        it("Should not be transcoded", async ()=>{
            const output = await transcode(file, 'small005', [], false);
            expect(output).to.eq(file);
        });
    });   
});