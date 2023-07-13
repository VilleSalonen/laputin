package fi.villesalonen.laputin;

import fi.villesalonen.laputin.entities.FileEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class FileController {
    private final FileRepository fileRepository;

    @Autowired
    public FileController(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    @GetMapping("/files")
    public List<FileEntity> listAll() {
        return fileRepository.findAll();
    }
}
